import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { trpc } from "../../src/lib/trpc";
import { COLORS, resolveImageUrl } from "../../src/lib/constants";
import { formatPrice, calculateDiscount, formatDate } from "@evanesc/ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: offer, isLoading } = trpc.offers.byId.useQuery({ id: id! });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);

  if (isLoading || !offer) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const discount = calculateDiscount(offer.normalPrice, offer.dealPrice);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
        >
          {offer.images.map((uri, i) => (
            <Image
              key={i}
              source={{ uri: resolveImageUrl(uri) }}
              style={styles.galleryImage}
              contentFit="cover"
              transition={200}
            />
          ))}
        </ScrollView>

        <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
          {/* Provider info */}
          <View style={styles.providerRow}>
            {offer.provider.logoUrl && (
              <Image
                source={{ uri: resolveImageUrl(offer.provider.logoUrl) }}
                style={styles.providerLogo}
                contentFit="cover"
              />
            )}
            <View>
              <Text style={styles.providerName}>{offer.provider.name}</Text>
              {offer.provider.address && (
                <Text style={styles.providerAddress}>
                  {offer.provider.address}
                </Text>
              )}
            </View>
          </View>

          {/* Offer details */}
          <Text style={styles.title}>{offer.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.dealPrice}>
              {formatPrice(offer.dealPrice)}
            </Text>
            <Text style={styles.normalPrice}>
              {formatPrice(offer.normalPrice)}
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          </View>

          {offer.description && (
            <Text style={styles.description}>{offer.description}</Text>
          )}

          {/* Slot picker */}
          <Text style={styles.sectionTitle}>Choisir un créneau</Text>
          <View style={styles.slotsGrid}>
            {offer.slots.map((slot) => (
              <Pressable
                key={slot.id}
                onPress={() => setSelectedSlot(slot.id)}
                style={[
                  styles.slotCard,
                  selectedSlot === slot.id && styles.slotCardActive,
                ]}
              >
                <Text
                  style={[
                    styles.slotDate,
                    selectedSlot === slot.id && styles.slotTextActive,
                  ]}
                >
                  {formatDate(slot.date)}
                </Text>
                <Text
                  style={[
                    styles.slotTime,
                    selectedSlot === slot.id && styles.slotTextActive,
                  ]}
                >
                  {slot.time}
                </Text>
                <Text
                  style={[
                    styles.slotSpots,
                    selectedSlot === slot.id && styles.slotTextActive,
                  ]}
                >
                  {slot.remainingSpots} place{slot.remainingSpots > 1 ? "s" : ""}
                </Text>
              </Pressable>
            ))}
          </View>

          {offer.slots.length === 0 && (
            <Text style={styles.noSlots}>
              Aucun créneau disponible pour le moment
            </Text>
          )}

          {/* Guests picker */}
          {selectedSlot && (
            <View style={styles.guestsRow}>
              <Text style={styles.guestsLabel}>Nombre de personnes</Text>
              <View style={styles.guestsPicker}>
                <Pressable
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                  style={styles.guestsButton}
                >
                  <Text style={styles.guestsButtonText}>−</Text>
                </Pressable>
                <Text style={styles.guestsCount}>{guests}</Text>
                <Pressable
                  onPress={() => setGuests(guests + 1)}
                  style={styles.guestsButton}
                >
                  <Text style={styles.guestsButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* Booking CTA */}
      {selectedSlot && (
        <View style={styles.cta}>
          <View>
            <Text style={styles.ctaPrice}>
              {formatPrice(
                parseFloat(offer.dealPrice) * guests,
              )}
            </Text>
            <Text style={styles.ctaGuests}>
              {guests} personne{guests > 1 ? "s" : ""}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/booking/confirm",
                params: {
                  offerId: offer.id,
                  slotId: selectedSlot,
                  guests: guests.toString(),
                },
              })
            }
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Réserver</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.textLight,
  },
  gallery: {
    height: 300,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  content: {
    padding: 20,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  providerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
  },
  providerName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
  },
  providerAddress: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  dealPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.accent,
  },
  normalPrice: {
    fontSize: 16,
    color: COLORS.textLight,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: COLORS.accent + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.accent,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  slotsGrid: {
    gap: 8,
  },
  slotCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  slotCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + "10",
  },
  slotDate: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  slotSpots: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 12,
  },
  slotTextActive: {
    color: COLORS.accent,
  },
  noSlots: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    paddingVertical: 20,
  },
  guestsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  guestsLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  guestsPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  guestsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  guestsButtonText: {
    color: COLORS.textInverse,
    fontSize: 18,
    fontWeight: "700",
  },
  guestsCount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    minWidth: 24,
    textAlign: "center",
  },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 36,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },
  ctaGuests: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  ctaButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
});
