import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "../../src/lib/trpc";
import { COLORS } from "../../src/lib/constants";
import { CATEGORIES, formatPrice, calculateDiscount } from "@evanesc/ui";

type CategoryValue = (typeof CATEGORIES)[number]["value"] | null;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>(null);

  const { data: offers } = trpc.offers.list.useQuery(
    selectedCategory ? { category: selectedCategory } : {},
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
        <Text style={styles.subtitle}>Parcourir par catégorie</Text>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        <Pressable
          onPress={() => setSelectedCategory(null)}
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive,
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              !selectedCategory && styles.categoryTextActive,
            ]}
          >
            Tous
          </Text>
        </Pressable>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.value}
            onPress={() => setSelectedCategory(cat.value)}
            style={[
              styles.categoryChip,
              selectedCategory === cat.value && styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.value && styles.categoryTextActive,
              ]}
            >
              {cat.emoji} {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
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
              <View style={styles.cardInfo}>
                <Text style={styles.providerName}>
                  {item.provider.name}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.dealPrice}>
                    {formatPrice(item.dealPrice)}
                  </Text>
                  <Text style={styles.normalPrice}>
                    {formatPrice(item.normalPrice)}
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{discount}%</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Aucune offre dans cette catégorie
            </Text>
          </View>
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  categories: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  categoryTextActive: {
    color: COLORS.textInverse,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: {
    width: 110,
    height: 110,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  providerName: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  dealPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.accent,
  },
  normalPrice: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: COLORS.accent + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accent,
  },
  empty: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});
