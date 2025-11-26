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

// * Color palette
export const colors = {
  // Base
  background: '#0a0a0f',
  surface: '#14141f',
  surfaceElevated: '#1a1a28',
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: '#a0a0b0',
  textTertiary: '#606070',
  
  // Accent
  accent: '#ff6b9d',
  accentHover: '#ff8bb3',
  accentMuted: '#ff6b9d40',
  
  // Secondary accent
  secondary: '#6b9fff',
  secondaryHover: '#8bb3ff',
  secondaryMuted: '#6b9fff40',
  
  // Status
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  
  // Border
  border: '#2a2a3a',
  borderHover: '#3a3a4a',
  
  // Overlay
  overlay: 'rgba(10, 10, 15, 0.85)',
} as const;

// * Typography scale
export const typography = {
  fontFamily: {
    sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
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

// * Motion/Animation
export const motion = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// * Border radius
export const radius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  full: '9999px',
} as const;

// * Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 8px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(255, 107, 157, 0.3)',
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
