/**
 * Design tokens for Tabeedar.
 *
 * Every colour, spacing step, radius and font size in the app comes from this file so a
 * rebrand is a one-file change. Components must never hardcode these values.
 *
 * NOTE: the palette is a placeholder until brand colours are decided.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
}

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#E2E2E2',
  text: '#111111',
  textMuted: '#5F6368',
  // White text on this green is 5.5:1, which meets WCAG AA for normal-size text.
  primary: '#047857',
  onPrimary: '#FFFFFF',
  danger: '#B42318',
  success: '#067647',
};

export const darkColors: ThemeColors = {
  background: '#0B0B0B',
  surface: '#1A1A1A',
  border: '#2E2E2E',
  text: '#F5F5F5',
  textMuted: '#A1A1AA',
  primary: '#34D399',
  onPrimary: '#052E1F',
  danger: '#F97066',
  success: '#32D583',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 13,
  body: 16,
  heading: 22,
  title: 30,
} as const;

/**
 * Urdu (Nastaliq-style) glyphs are much taller than Latin ones and are clipped by the
 * default line height, so each language gets its own multiplier. Tune on a real device.
 */
export const lineHeightMultiplier = {
  en: 1.4,
  ur: 1.9,
} as const;

/** Minimum touch target (dp) recommended by iOS and Android accessibility guidelines. */
export const MIN_TOUCH_TARGET = 48;
