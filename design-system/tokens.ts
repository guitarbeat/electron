/**
 * Design System Tokens
 *
 * Centralized design tokens for consistent spacing, colors, typography, and motion.
 */

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

// * Color palette (Retro theme)
export const colors = {
  // Base
  background: '#0a0b0e',
  surface: 'rgba(23, 33, 58, 0.7)',
  surfaceElevated: 'rgba(30, 42, 75, 0.85)',

  // Text (improved contrast for readability)
  textPrimary: '#ffffff',
  textSecondary: '#f0f0f5', // Brighter for better contrast
  textTertiary: '#c8c8d8', // Increased brightness for legibility

  // Accent (Hot Pink)
  accent: '#ff69b4',
  accentHover: '#ff8bb3',
  accentMuted: '#ff69b440',
  accentLight: '#fca5d3',

  // Secondary accent (Light Sky Blue)
  secondary: '#87cefa',
  secondaryHover: '#a0d8ff',
  secondaryMuted: '#87cefa40',

  // Tertiary (Medium Purple)
  tertiary: '#9370db',
  tertiaryHover: '#ab87e8',

  // Status
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',

  // Border
  border: '#ff69b4',
  borderSecondary: '#87cefa',
  borderTertiary: '#9370db',
  borderInset: '#1f4068',

  // Overlay
  overlay: 'rgba(26, 26, 46, 0.8)',

  // Special retro colors
  yellow: '#ffeb3b',
  khaki: '#f0e68c',
  // Gradients
  gradientPink: 'linear-gradient(135deg, #ff69b4 0%, #ff8bb3 100%)',
  gradientBlue: 'linear-gradient(135deg, #87cefa 0%, #a0d8ff 100%)',
  gradientPurple: 'linear-gradient(135deg, #9370db 0%, #ab87e8 100%)',
  gradientCard: 'linear-gradient(180deg, rgba(27, 40, 69, 0.95) 0%, rgba(27, 40, 69, 0.85) 100%)',
} as const;

// * Typography scale (Legible and tight)
export const typography = {
  fontFamily: {
    heading: ['Papyrus', 'Copperplate', 'serif'],
    body: ['Papyrus', 'Trebuchet MS', 'sans-serif'],
    sans: ['Papyrus', 'Trebuchet MS', 'sans-serif'],
    mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
  },
  fontSize: {
    xs: 'calc(0.7rem + 0.2vw)',
    sm: 'calc(0.8rem + 0.3vw)',
    base: 'calc(0.9rem + 0.4vw)',
    lg: 'calc(1rem + 0.6vw)',
    xl: 'calc(1.1rem + 0.8vw)',
    '2xl': 'calc(1.3rem + 1.2vw)',
    '3xl': 'calc(1.5rem + 1.8vw)',
    '4xl': 'calc(1.8rem + 2.5vw)',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.3, // Slightly more breathing room
    normal: 1.6, // Better for body text readability
    relaxed: 1.85, // More generous for dense content
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0.015em', // Slight spacing improves Papyrus readability
    wide: '0.04em',
    wider: '0.065em',
  },
} as const;

// * Motion/Animation (Retro feel)
export const motion = {
  duration: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    button: '50ms', // Fast for 3D button press
  },
  easing: {
    ease: 'ease-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
} as const;

// * Border radius (Retro style)
export const radius = {
  none: '0',
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  // Card border radius (optimized for mobile)
  card: '20px',
  full: '9999px',
} as const;

// * Border styles (Retro 3D)
export const borders = {
  cardOutset: '4px outset',
  buttonOutset: '2px outset',
  iconOutset: '2px outset',
  inputInset: '2px inset',
} as const;

// * Shadows (Retro 3D effects - Enhanced)
export const shadows = {
  // Card shadows (enhanced depth)
  card: '5px 5px 0px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)',
  cardHover:
    '8px 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(255, 105, 180, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
  cardElevated: '6px 6px 0px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)',
  // Button shadows (3D effect - enhanced)
  button: '0 4px 0 rgba(0,0,0,0.5), 0 5px 0 rgba(255,255,255,0.3) inset, 0 2px 4px rgba(0,0,0,0.3)',
  buttonHover:
    '0 2px 0 rgba(0,0,0,0.5), 0 3px 0 rgba(255,255,255,0.3) inset, 0 1px 2px rgba(0,0,0,0.3)',
  buttonActive: '0 0px 0 rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.3) inset',
  buttonLarge:
    '0 6px 0 rgba(0,0,0,0.6), 0 8px 0 rgba(255,255,255,0.3) inset, 0 0 25px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)',
  // Glow effects (enhanced)
  glow: '0 0 20px rgba(255, 105, 180, 0.5), 0 0 40px rgba(255, 105, 180, 0.2)',
  glowStrong: '0 0 30px rgba(255, 105, 180, 0.8), 0 0 60px rgba(255, 105, 180, 0.4)',
  glowBlue: '0 0 25px rgba(135, 206, 250, 0.8), 0 0 50px rgba(135, 206, 250, 0.3)',
  glowYellow: '0 0 20px rgba(255, 235, 59, 0.6), 0 0 40px rgba(255, 235, 59, 0.3)',
  // Text shadows - Multi-layered for depth
  textGlow:
    '0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(255, 105, 180, 0.5), 0 0 24px rgba(255, 105, 180, 0.3)',
  textGlowBlue:
    '0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(135, 206, 250, 0.5), 0 0 24px rgba(135, 206, 250, 0.3)',
  textGlowYellow:
    '0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(255, 235, 59, 0.5), 0 0 24px rgba(255, 235, 59, 0.3)',

  // Text gradients
  textGradientPink: 'linear-gradient(135deg, #ff69b4 0%, #ff8bb3 50%, #fff 100%)',
  textGradientBlue: 'linear-gradient(135deg, #87cefa 0%, #a0d8ff 50%, #fff 100%)',
  textGradientYellow: 'linear-gradient(135deg, #ffeb3b 0%, #fff9c4 50%, #fff 100%)',

  // Text outline effects
  textOutline: '0 0 1px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.4)',
} as const;

// * Z-index scale
export const zIndex = {
  base: 0,
  elevated: 10,
  dropdown: 20,
  overlay: 30,
  modal: 40,
  tooltip: 50,
} as const;

// * Layout constants for app shell/navigation
export const layout = {
  topBarHeight: '64px',
  topBarMobileHeight: '58px',
  tabBarHeight: '72px',
  desktopNavHeight: '56px',
  contentMaxWidth: '1200px',
  contentPaddingX: '1rem',
  contentPaddingXDesktop: '1.5rem',
} as const;
