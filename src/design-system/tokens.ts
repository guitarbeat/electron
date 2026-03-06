/**
 * Design System Tokens
 *
 * Centralized design tokens for consistent spacing, colors, typography, and motion.
 * Modernized: Inter font stack, improved contrast, surface layering system.
 * Now supports theme switching between Movies and Places modes.
 */

import { moviesTheme, placesTheme } from '@/context/themeTokens.ts';

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

// * Color palette (Modernized -- retro accents, modern foundations)
// Default colors (Movies theme - backward compatibility)
export const colors = {
  // Base
  background: '#020617',
  surface: 'rgba(15, 23, 42, 0.65)',
  surfaceElevated: 'rgba(30, 41, 59, 0.8)',

  // Surface layering system (for consistent depth hierarchy)
  surface0: '#0a0f1e', // deepest -- page background
  surface1: 'rgba(15, 23, 42, 0.7)', // card level
  surface2: 'rgba(30, 41, 59, 0.85)', // elevated / floating elements
  surface3: 'rgba(51, 65, 85, 0.92)', // popovers / modals

  // Text (improved contrast for WCAG AA compliance)
  textPrimary: '#f8fafc',
  textSecondary: '#e2e8f0',
  textTertiary: '#e2e4f4', // Meets WCAG AA 4.5:1 on dark backgrounds

  // Interactive (for links and clickable elements)
  interactive: '#ff7fc6',
  interactiveHover: '#ff9bd3',

  // Accent (Hot Pink)
  accent: '#ff7fc6',
  accentHover: '#ff9bd3',
  accentMuted: '#ff7fc640',
  accentLight: '#ffc2e6',

  // Secondary accent (Light Sky Blue)
  secondary: '#95dcff',
  secondaryHover: '#b3e8ff',
  secondaryMuted: '#95dcff40',

  // Tertiary (Medium Purple)
  tertiary: '#a78af2',
  tertiaryHover: '#c0a8ff',

  // Status
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',

  // Border
  border: 'rgba(99, 102, 241, 0.4)',
  borderSecondary: 'rgba(236, 72, 153, 0.3)',
  borderTertiary: 'rgba(56, 189, 248, 0.3)',
  borderInset: '#365a90',
  borderSubtle: 'rgba(148, 163, 184, 0.15)',

  // Overlay
  overlay: 'rgba(2, 6, 23, 0.78)',

  // Special retro colors
  yellow: '#fff06a',
  khaki: '#f7efaa',

  // Gradients
  gradientPink: 'linear-gradient(135deg, #ff7fc6 0%, #ff9bd3 100%)',
  gradientBlue: 'linear-gradient(135deg, #95dcff 0%, #b3e8ff 100%)',
  gradientPurple: 'linear-gradient(135deg, #a78af2 0%, #c0a8ff 100%)',
  gradientCard: 'linear-gradient(180deg, rgba(44, 63, 104, 0.95) 0%, rgba(36, 53, 90, 0.88) 100%)',
} as const;

// * Typography scale (PAPYRUS EVERYWHERE!)
export const typography = {
  fontFamily: {
    heading: ['Papyrus', 'Comic Sans MS', 'cursive', 'sans-serif'],
    body: ['Papyrus', 'Comic Sans MS', 'cursive', 'sans-serif'],
    sans: ['Papyrus', 'Comic Sans MS', 'cursive', 'sans-serif'],
    mono: ['Papyrus', 'Comic Sans MS', 'cursive', 'monospace'],
  },
  fontSize: {
    xs: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.85rem)',
    sm: 'clamp(0.8125rem, 0.78rem + 0.15vw, 0.9375rem)',
    base: 'clamp(0.875rem, 0.84rem + 0.2vw, 1rem)',
    lg: 'clamp(1rem, 0.95rem + 0.3vw, 1.175rem)',
    xl: 'clamp(1.125rem, 1rem + 0.5vw, 1.375rem)',
    '2xl': 'clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)',
    '3xl': 'clamp(1.625rem, 1.4rem + 1vw, 2.25rem)',
    '4xl': 'clamp(2rem, 1.7rem + 1.5vw, 3rem)',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.55,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '-0.01em',
    wide: '0.02em',
    wider: '0.05em',
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

// * Border styles (Modernized -- lighter, less aggressive)
export const borders = {
  cardOutset: '1px solid',
  buttonOutset: '1px solid',
  iconOutset: '1px solid',
  inputInset: '1px solid',
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

// * Layout constants for app shell/navigation
export const layout = {
  topBarHeight: '56px',
  topBarMobileHeight: '52px',
  tabBarHeight: '60px',
  desktopNavHeight: '48px',
  contentMaxWidth: '1200px',
  contentPaddingX: '1rem',
  contentPaddingXDesktop: '1.5rem',
} as const;

// Export theme objects for direct access
export { moviesTheme, placesTheme };
