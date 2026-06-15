/**
 * Design System Tokens
 *
 * Spacing, typography, motion, and structural tokens. Theme palettes live in
 * `themes.ts` and are applied at runtime via `applyTheme()`.
 */

import { moviesThemeDefinition, placesThemeDefinition } from './themes.ts';

/** @deprecated Prefer `useTheme().theme` — kept for gradual migration of inline styles. */
export const moviesTheme = moviesThemeDefinition.tokens;

/** @deprecated Prefer `useTheme().theme` */
export const placesTheme = placesThemeDefinition.tokens;

export const shellTokens = moviesThemeDefinition.shell;

// * Spacing scale (Tight but balanced)
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.25rem', // 20px
  xl: '1.75rem', // 28px
  '2xl': '2.5rem', // 40px
  '3xl': '3.5rem', // 56px
} as const;

/**
 * Default semantic colors (Movies). For tab-aware inline styles, use `useThemeColors()`.
 */
export const colors = {
  ...moviesThemeDefinition.semantic,
  interactive: moviesThemeDefinition.semantic.accent,
  interactiveHover: moviesThemeDefinition.semantic.accentHover,
  borderSecondary: 'rgba(200, 141, 89, 0.28)',
  borderTertiary: 'rgba(142, 159, 130, 0.24)',
  borderInset: '#7d5f3a',
  yellow: '#d4b173',
  khaki: '#e8d3ac',
  gradientPink: 'linear-gradient(135deg, #c88d59 0%, #d9a170 100%)',
  gradientBlue: 'linear-gradient(135deg, #8e9f82 0%, #a3b497 100%)',
  gradientPurple: 'linear-gradient(135deg, #9a6554 0%, #af7b68 100%)',
  gradientCard: moviesThemeDefinition.tokens.gradientCard,
} as const;

export type { ThemeName, AppThemeDefinition } from './themes.ts';
export { appThemes, getAppTheme, moviesThemeDefinition, placesThemeDefinition } from './themes.ts';
export { applyTheme, clearAppliedTheme } from './applyTheme.ts';

// * Typography scale
const fontFamily = {
  heading: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  display: ['Papyrus', 'serif'],
  mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
} as const;

const fontFamilyValue = {
  heading: fontFamily.heading.join(', '),
  body: fontFamily.body.join(', '),
  sans: fontFamily.sans.join(', '),
  display: fontFamily.display.join(', '),
  mono: fontFamily.mono.join(', '),
} as const;

const fontSize = {
  '3xs': '0.5625rem',
  '2xs': '0.625rem',
  xs: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.85rem)',
  sm: 'clamp(0.8125rem, 0.78rem + 0.15vw, 0.9375rem)',
  base: 'clamp(0.875rem, 0.84rem + 0.2vw, 1rem)',
  lg: 'clamp(1rem, 0.95rem + 0.3vw, 1.175rem)',
  xl: 'clamp(1.125rem, 1rem + 0.5vw, 1.375rem)',
  '2xl': 'clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)',
  '3xl': 'clamp(1.625rem, 1.4rem + 1vw, 2.25rem)',
  '4xl': 'clamp(2rem, 1.7rem + 1.5vw, 3rem)',
} as const;

const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

const lineHeight = {
  none: 1,
  heading: 1.2,
  snug: 1.25,
  tight: 1.3,
  normal: 1.55,
  relaxed: 1.75,
} as const;

const letterSpacing = {
  display: '-0.04em',
  none: '0',
  tight: '-0.02em',
  normal: '-0.01em',
  wide: '0.02em',
  dense: '0.03em',
  button: '0.04em',
  wider: '0.05em',
  eyebrow: '0.08em',
  widest: '0.14em',
} as const;

export const typography = {
  fontFamily,
  fontFamilyValue,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  presets: {
    eyebrow: {
      fontFamily: fontFamilyValue.body,
      fontSize: '0.72rem',
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.none,
      letterSpacing: letterSpacing.eyebrow,
      textTransform: 'uppercase',
    },
    buttonLabel: {
      fontFamily: fontFamilyValue.heading,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.none,
      letterSpacing: letterSpacing.button,
      textTransform: 'uppercase',
    },
    titleSm: {
      fontFamily: fontFamilyValue.heading,
      fontSize: '1.25rem',
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.heading,
      letterSpacing: letterSpacing.normal,
    },
    titleMd: {
      fontFamily: fontFamilyValue.heading,
      fontSize: '1.5rem',
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.heading,
      letterSpacing: letterSpacing.tight,
    },
    tabLabel: {
      fontFamily: fontFamilyValue.heading,
      fontSize: 'clamp(0.72rem, 1vw + 0.45rem, 0.85rem)',
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.none,
      letterSpacing: letterSpacing.wider,
      textTransform: 'uppercase',
    },
    badge: {
      fontFamily: fontFamilyValue.heading,
      fontSize: '0.7rem',
      fontWeight: fontWeight.extrabold,
      lineHeight: lineHeight.none,
      letterSpacing: letterSpacing.wider,
      textTransform: 'uppercase',
    },
    caption: {
      fontFamily: fontFamilyValue.body,
      fontSize: fontSize['2xs'],
      lineHeight: lineHeight.tight,
    },
    micro: {
      fontFamily: fontFamilyValue.body,
      fontSize: fontSize['3xs'],
      lineHeight: lineHeight.tight,
    },
    bodySm: {
      fontFamily: fontFamilyValue.body,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
    },
    bodyXs: {
      fontFamily: fontFamilyValue.body,
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
    },
    posterTitle: {
      fontFamily: fontFamilyValue.heading,
      fontSize: 'clamp(0.85rem, 2.5vw, 1.15rem)',
      fontWeight: fontWeight.extrabold,
      lineHeight: lineHeight.heading,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
  },
} as const;

// * Motion/Animation (Smooth, modern)
export const motion = {
  duration: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    button: '80ms',
    theme: '300ms', // Theme transition duration
  },
  reducedDuration: {
    fast: '0.01ms',
    normal: '0.01ms',
    slow: '0.01ms',
    button: '0.01ms',
    theme: '0.01ms',
  },
  easing: {
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    linear: 'linear',
  },
} as const;

// * Border radius (Modern, softer)
export const radius = {
  none: '0',
  sm: '0.375rem', // 6px
  md: '0.625rem', // 10px
  lg: '0.875rem', // 14px
  card: '1rem', // 16px
  xl: '1.25rem', // 20px
  full: '9999px',
} as const;

// * Shadows (Modern depth system)
export const shadows = {
  // Card shadows
  card: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
  cardHover:
    '0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(255, 127, 198, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
  cardElevated: '0 4px 16px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',

  // Button shadows (subtle 3D)
  button: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
  buttonHover: '0 4px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
  buttonActive: '0 1px 2px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.15)',
  buttonLarge: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',

  // Glow effects (kept but toned down)
  glow: '0 0 15px rgba(255, 127, 198, 0.4), 0 0 30px rgba(255, 127, 198, 0.15)',
  glowStrong: '0 0 20px rgba(255, 127, 198, 0.6), 0 0 40px rgba(255, 127, 198, 0.25)',
  glowBlue: '0 0 15px rgba(149, 220, 255, 0.5), 0 0 30px rgba(149, 220, 255, 0.2)',
  glowYellow: '0 0 15px rgba(255, 240, 106, 0.5), 0 0 30px rgba(255, 240, 106, 0.2)',

  // Text shadows
  textGlow: '0 1px 2px rgba(0, 0, 0, 0.5), 0 0 8px rgba(255, 127, 198, 0.35)',
  textGlowBlue: '0 1px 2px rgba(0, 0, 0, 0.5), 0 0 8px rgba(149, 220, 255, 0.35)',
  textGlowYellow: '0 1px 2px rgba(0, 0, 0, 0.5), 0 0 8px rgba(255, 240, 106, 0.35)',

  // Text gradients (kept)
  textGradientPink: 'linear-gradient(135deg, #ff7fc6 0%, #ff9bd3 50%, #fff 100%)',
  textGradientBlue: 'linear-gradient(135deg, #95dcff 0%, #b3e8ff 50%, #fff 100%)',
  textGradientYellow: 'linear-gradient(135deg, #fff06a 0%, #fff8bf 50%, #fff 100%)',

  // Text outline effects
  textOutline: '0 0 1px rgba(0, 0, 0, 0.6), 0 0 2px rgba(0, 0, 0, 0.4)',

  // Floating elements
  floating: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)',
} as const;

// * Z-index scale
export const zIndex = {
  base: 0,
  elevated: 10,
  dropdown: 100,
  overlay: 900,
  modal: 2000,
  tooltip: 2100,
} as const;
