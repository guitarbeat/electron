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
  // Gradients
  gradientPink: 'linear-gradient(135deg, #ff69b4 0%, #ff8bb3 100%)',
  gradientBlue: 'linear-gradient(135deg, #87cefa 0%, #a0d8ff 100%)',
  gradientPurple: 'linear-gradient(135deg, #9370db 0%, #ab87e8 100%)',
  gradientCard: 'linear-gradient(180deg, rgba(27, 40, 69, 0.95) 0%, rgba(27, 40, 69, 0.85) 100%)',
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

// * Shadows (Retro 3D effects - Enhanced)
export const shadows = {
  // Card shadows (enhanced depth)
  card: '5px 5px 0px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)',
  cardHover: '8px 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(255, 105, 180, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
  cardElevated: '6px 6px 0px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)',
  // Button shadows (3D effect - enhanced)
  button: '0 4px 0 rgba(0,0,0,0.5), 0 5px 0 rgba(255,255,255,0.3) inset, 0 2px 4px rgba(0,0,0,0.3)',
  buttonHover: '0 2px 0 rgba(0,0,0,0.5), 0 3px 0 rgba(255,255,255,0.3) inset, 0 1px 2px rgba(0,0,0,0.3)',
  buttonActive: '0 0px 0 rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.3) inset',
  buttonLarge: '0 6px 0 rgba(0,0,0,0.6), 0 8px 0 rgba(255,255,255,0.3) inset, 0 0 25px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)',
  // Glow effects (enhanced)
  glow: '0 0 20px rgba(255, 105, 180, 0.5), 0 0 40px rgba(255, 105, 180, 0.2)',
  glowStrong: '0 0 30px rgba(255, 105, 180, 0.8), 0 0 60px rgba(255, 105, 180, 0.4)',
  glowBlue: '0 0 25px rgba(135, 206, 250, 0.8), 0 0 50px rgba(135, 206, 250, 0.3)',
  glowYellow: '0 0 20px rgba(255, 235, 59, 0.6), 0 0 40px rgba(255, 235, 59, 0.3)',
  // Text shadows - Multi-layered for depth
  textGlow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(255, 105, 180, 0.5), 0 0 24px rgba(255, 105, 180, 0.3)',
  textGlowBlue: '0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(135, 206, 250, 0.5), 0 0 24px rgba(135, 206, 250, 0.3)',
  textGlowYellow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(255, 235, 59, 0.5), 0 0 24px rgba(255, 235, 59, 0.3)',
  
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
