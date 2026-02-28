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
  background: '#101325',
  surface: 'rgba(38, 52, 88, 0.72)',
  surfaceElevated: 'rgba(52, 72, 118, 0.88)',

  // Text (improved contrast for readability)
  textPrimary: '#ffffff',
  textSecondary: '#f7f7ff', // Brighter for better contrast
  textTertiary: '#d8daef', // Increased brightness for legibility

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
  border: '#ff7fc6',
  borderSecondary: '#95dcff',
  borderTertiary: '#a78af2',
  borderInset: '#365a90',

  // Overlay
  overlay: 'rgba(34, 39, 70, 0.78)',

  // Special retro colors
  yellow: '#fff06a',
  khaki: '#f7efaa',
  // Gradients
  gradientPink: 'linear-gradient(135deg, #ff7fc6 0%, #ff9bd3 100%)',
  gradientBlue: 'linear-gradient(135deg, #95dcff 0%, #b3e8ff 100%)',
  gradientPurple: 'linear-gradient(135deg, #a78af2 0%, #c0a8ff 100%)',
  gradientCard: 'linear-gradient(180deg, rgba(44, 63, 104, 0.95) 0%, rgba(36, 53, 90, 0.88) 100%)',
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
    '8px 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(255, 127, 198, 0.65), inset 0 1px 0 rgba(255,255,255,0.1)',
  cardElevated: '6px 6px 0px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)',
  // Button shadows (3D effect - enhanced)
  button: '0 4px 0 rgba(0,0,0,0.5), 0 5px 0 rgba(255,255,255,0.3) inset, 0 2px 4px rgba(0,0,0,0.3)',
  buttonHover:
    '0 2px 0 rgba(0,0,0,0.5), 0 3px 0 rgba(255,255,255,0.3) inset, 0 1px 2px rgba(0,0,0,0.3)',
  buttonActive: '0 0px 0 rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.3) inset',
  buttonLarge:
    '0 6px 0 rgba(0,0,0,0.6), 0 8px 0 rgba(255,255,255,0.3) inset, 0 0 25px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)',
  // Glow effects (enhanced)
  glow: '0 0 20px rgba(255, 127, 198, 0.6), 0 0 40px rgba(255, 127, 198, 0.25)',
  glowStrong: '0 0 30px rgba(255, 127, 198, 0.85), 0 0 60px rgba(255, 127, 198, 0.45)',
  glowBlue: '0 0 25px rgba(149, 220, 255, 0.85), 0 0 50px rgba(149, 220, 255, 0.35)',
  glowYellow: '0 0 20px rgba(255, 240, 106, 0.65), 0 0 40px rgba(255, 240, 106, 0.35)',
  // Text shadows - Multi-layered for depth
  textGlow:
    '0 1px 0 rgba(255, 255, 255, 0.32), 0 2px 4px rgba(0, 0, 0, 0.55), 0 0 12px rgba(255, 127, 198, 0.55), 0 0 24px rgba(255, 127, 198, 0.35)',
  textGlowBlue:
    '0 1px 0 rgba(255, 255, 255, 0.32), 0 2px 4px rgba(0, 0, 0, 0.55), 0 0 12px rgba(149, 220, 255, 0.55), 0 0 24px rgba(149, 220, 255, 0.35)',
  textGlowYellow:
    '0 1px 0 rgba(255, 255, 255, 0.32), 0 2px 4px rgba(0, 0, 0, 0.55), 0 0 12px rgba(255, 240, 106, 0.55), 0 0 24px rgba(255, 240, 106, 0.35)',

  // Text gradients
  textGradientPink: 'linear-gradient(135deg, #ff7fc6 0%, #ff9bd3 50%, #fff 100%)',
  textGradientBlue: 'linear-gradient(135deg, #95dcff 0%, #b3e8ff 50%, #fff 100%)',
  textGradientYellow: 'linear-gradient(135deg, #fff06a 0%, #fff8bf 50%, #fff 100%)',

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
