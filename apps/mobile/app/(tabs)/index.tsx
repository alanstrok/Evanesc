import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "../../src/lib/trpc";
import { COLORS } from "../../src/lib/constants";
import { formatPrice, calculateDiscount } from "@evanesc/ui";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    data: offers,
    isLoading,
    refetch,
  } = trpc.offers.list.useQuery({});

  // Sort by discount percentage (highest first)
  const sortedOffers = offers
    ?.slice()
    .sort(
      (a, b) =>
        calculateDiscount(b.normalPrice, b.dealPrice) -
        calculateDiscount(a.normalPrice, a.dealPrice),
    );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>Evanesc</Text>
        <Text style={styles.subtitle}>Deals éphémères — St Barth</Text>
      </View>

      <FlatList
        data={sortedOffers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const discount = calculateDiscount(item.normalPrice, item.dealPrice);
          return (
            <Pressable
              onPress={() => router.push(`/offers/${item.id}`)}
              style={styles.card}
            >
              {item.images[0] && (
                <Image
                  source={{ uri: item.images[0] }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={200}
                />
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>-{discount}%</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.providerName}>
                  {item.provider.name}
                </Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.dealPrice}>
                    {formatPrice(item.dealPrice)}
                  </Text>
                  <Text style={styles.normalPrice}>
                    {formatPrice(item.normalPrice)}
                  </Text>
                </View>
                <Text style={styles.slotsText}>
                  {item.slots.length} créneau
                  {item.slots.length !== 1 ? "x" : ""} disponible
                  {item.slots.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Aucun deal disponible pour le moment
              </Text>
              <Text style={styles.emptySubtext}>
                Revenez bientôt pour découvrir de nouvelles offres
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
  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: {
    width: "100%",
    height: 200,
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: "700",
  },
  cardContent: {
    padding: 16,
  },
  providerName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 8,
  },
  dealPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.accent,
  },
  normalPrice: {
    fontSize: 14,
    color: COLORS.textLight,
    textDecorationLine: "line-through",
  },
  slotsText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
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
