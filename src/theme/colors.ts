// Solid Material You color palette (no gradients).
// See prompt.md section 4.

export const colors = {
  primary: "#2563EB",
  primaryContainer: "#DBEAFE",
  secondary: "#7C3AED",
  secondaryContainer: "#EDE9FE",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceVariant: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#94A3B8",
  outline: "#94A3B8",
  error: "#EF4444",
  errorContainer: "#FEF2F2",
  success: "#16A34A",
  white: "#FFFFFF",

  // Platform accent colors
  tiktok: "#010101",
  instagram: "#C13584",
  youtube: "#FF0000",
  video: "#7C3AED",
} as const;

export type ColorName = keyof typeof colors;
