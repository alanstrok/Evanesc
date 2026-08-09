export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Uploaded images are stored as relative paths (/api/uploads/...) —
// resolve them against the API host; absolute URLs pass through untouched
export function resolveImageUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

export const COLORS = {
  primary: "#1a1a1a",
  accent: "#c9a96e",
  accentLight: "#d4b97f",
  background: "#ffffff",
  backgroundDark: "#0a0a0a",
  card: "#f9f9f9",
  text: "#1a1a1a",
  textLight: "#6b7280",
  textInverse: "#ffffff",
  border: "#e5e7eb",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
} as const;
