import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "../../src/lib/trpc";
import { COLORS } from "../../src/lib/constants";
import { formatPrice, formatDate } from "@evanesc/ui";

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery();
  const utils = trpc.useUtils();

  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => utils.bookings.myBookings.invalidate(),
  });

  const statusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return { text: "Confirmé", color: COLORS.success };
      case "cancelled":
        return { text: "Annulé", color: COLORS.error };
      default:
        return { text: "En attente", color: COLORS.warning };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes réservations</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const status = statusLabel(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.offerTitle}>
                    {item.offerSlot.offer.title}
                  </Text>
                  <Text style={styles.providerName}>
                    {item.offerSlot.offer.provider.name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: status.color + "15" },
                  ]}
                >
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.text}
                  </Text>
                </View>
              </View>

              <View style={styles.details}>
                <Text style={styles.detailText}>
                  {formatDate(item.offerSlot.date)} à {item.offerSlot.time}
                </Text>
                <Text style={styles.detailText}>
                  {item.guestsCount} personne{item.guestsCount > 1 ? "s" : ""}
                </Text>
                <Text style={styles.price}>
                  {formatPrice(item.offerSlot.offer.dealPrice)}
                </Text>
              </View>

              {item.status === "pending" && (
                <Pressable
                  onPress={() => cancelBooking.mutate({ bookingId: item.id })}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune réservation</Text>
              <Text style={styles.emptySubtext}>
                Explorez les deals pour réserver
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  providerName: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  details: {
    marginTop: 12,
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.accent,
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.error,
  },
  empty: {
    paddingTop: 80,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
});
