import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { trpc } from "../../src/lib/trpc";
import { COLORS } from "../../src/lib/constants";
import { formatPrice, formatDate } from "@evanesc/ui";

export default function BookingConfirmScreen() {
  const { offerId, slotId, guests } = useLocalSearchParams<{
    offerId: string;
    slotId: string;
    guests: string;
  }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data: offer } = trpc.offers.byId.useQuery({ id: offerId! });
  const { data: config } = trpc.config.get.useQuery();
  const utils = trpc.useUtils();

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      utils.bookings.myBookings.invalidate();
      utils.offers.byId.invalidate({ id: offerId! });
    },
  });

  const slot = offer?.slots.find((s) => s.id === slotId);
  const guestsCount = parseInt(guests || "1");
  const totalPrice = offer
    ? parseFloat(offer.dealPrice) * guestsCount
    : 0;
  const paymentsEnabled = config?.paymentsEnabled ?? false;

  const handleBooking = async () => {
    if (!slotId) return;
    setLoading(true);

    try {
      const { checkoutUrl } = await createBooking.mutateAsync({
        offerSlotId: slotId,
        guestsCount,
      });

      if (checkoutUrl) {
        // Payments enabled: pay via Stripe Checkout in the browser,
        // the webhook confirms the booking server-side
        await WebBrowser.openBrowserAsync(checkoutUrl);
        router.replace("/(tabs)/bookings");
        return;
      }

      Alert.alert(
        "Réservation confirmée",
        "Votre réservation est confirmée. Le règlement s'effectue sur place.",
        [
          {
            text: "Voir mes réservations",
            onPress: () => router.replace("/(tabs)/bookings"),
          },
        ],
      );
    } catch (err: any) {
      if (err?.data?.code === "UNAUTHORIZED") {
        Alert.alert(
          "Connexion requise",
          "Connectez-vous pour réserver cette offre.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Se connecter",
              onPress: () => router.push("/auth/login"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Erreur",
          err.message || "Impossible de créer la réservation",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!offer || !slot) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Résumé de la réservation</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Offre</Text>
          <Text style={styles.value}>{offer.title}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Prestataire</Text>
          <Text style={styles.value}>{offer.provider.name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{formatDate(slot.date)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Heure</Text>
          <Text style={styles.value}>{slot.time}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Personnes</Text>
          <Text style={styles.value}>{guestsCount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Prix unitaire</Text>
          <Text style={styles.value}>{formatPrice(offer.dealPrice)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
        </View>

        <View style={styles.savingsRow}>
          <Text style={styles.savingsText}>
            Vous économisez{" "}
            {formatPrice(
              (parseFloat(offer.normalPrice) - parseFloat(offer.dealPrice)) *
                guestsCount,
            )}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleBooking}
        disabled={loading}
        style={[styles.payButton, loading && styles.payButtonDisabled]}
      >
        <Text style={styles.payButtonText}>
          {loading
            ? "Traitement..."
            : paymentsEnabled
              ? `Payer ${formatPrice(totalPrice)}`
              : "Confirmer la réservation"}
        </Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        {paymentsEnabled
          ? "Paiement sécurisé par Stripe. Vous serez redirigé vers la page de paiement."
          : "Le règlement s'effectue directement sur place auprès du prestataire."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.textLight,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.accent,
  },
  savingsRow: {
    backgroundColor: COLORS.success + "15",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.success,
    textAlign: "center",
  },
  payButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: COLORS.textInverse,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
});
