// Shared constants and types used across web and mobile
export const COLORS = {
  primary: "#1a1a1a",
  accent: "#c9a96e",
  accentLight: "#d4b97f",
  background: "#ffffff",
  backgroundDark: "#0a0a0a",
  text: "#1a1a1a",
  textLight: "#6b7280",
  textInverse: "#ffffff",
  border: "#e5e7eb",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
} as const;

export const CATEGORIES = [
  { value: "restaurants", label: "Restaurants", emoji: "🍽️" },
  { value: "hotels", label: "Hôtels", emoji: "🏨" },
  { value: "villas", label: "Villas", emoji: "🏡" },
  { value: "spas", label: "Spas", emoji: "💆" },
  { value: "water_sports", label: "Sports nautiques", emoji: "🏄" },
  { value: "excursions", label: "Excursions", emoji: "⛵" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

export function calculateDiscount(normalPrice: string | number, dealPrice: string | number): number {
  const normal = typeof normalPrice === "string" ? parseFloat(normalPrice) : normalPrice;
  const deal = typeof dealPrice === "string" ? parseFloat(dealPrice) : dealPrice;
  if (normal === 0) return 0;
  return Math.round(((normal - deal) / normal) * 100);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}
