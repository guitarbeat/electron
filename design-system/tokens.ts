/**
 * Design System Tokens
 * 
 * Centralized design tokens for consistent spacing, colors, typography, and motion.
 */

// * Spacing scale (8px base unit)
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const;

// * Color palette (Retro theme)
export const colors = {
  // Base
  background: '#1a1a2e',
  surface: 'rgba(27, 40, 69, 0.85)',
  surfaceElevated: 'rgba(27, 40, 69, 0.95)',
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: '#e0e0e0',
  textTertiary: '#a0a0b0',
  
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
} as const;

// * Typography scale (Retro with Papyrus)
export const typography = {
  fontFamily: {
    heading: ['Papyrus', 'fantasy'],
    body: ['Papyrus', 'fantasy'],
    sans: ['Papyrus', 'fantasy'],
    mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
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
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  card: '8px',     // Card border radius
  full: '9999px',
} as const;

// * Border styles (Retro 3D)
export const borders = {
  cardOutset: '4px outset',
  buttonOutset: '2px outset',
  iconOutset: '2px outset',
  inputInset: '2px inset',
} as const;

// * Shadows (Retro 3D effects)
export const shadows = {
  // Card shadows
  card: '5px 5px 0px rgba(0,0,0,0.3)',
  cardHover: '8px 8px 15px rgba(0,0,0,0.4), 0 0 10px rgba(255, 105, 180, 0.5)',
  // Button shadows (3D effect)
  button: '0 4px 0 #000, 0 5px 0 rgba(255,255,255,0.3) inset',
  buttonHover: '0 2px 0 #000, 0 3px 0 rgba(255,255,255,0.3) inset',
  buttonActive: '0 0px 0 #000, 0 1px 0 rgba(255,255,255,0.3) inset',
  buttonLarge: '0 6px 0 #000, 0 8px 0 rgba(255,255,255,0.3) inset, 0 0 20px rgba(0,0,0,0.5)',
  // Glow effects
  glow: '0 0 15px rgba(255, 105, 180, 0.4)',
  glowStrong: '0 0 30px rgba(255, 105, 180, 1)',
  glowBlue: '0 0 20px rgba(135, 206, 250, 0.7)',
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
