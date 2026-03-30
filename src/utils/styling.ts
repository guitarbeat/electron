import { colors, spacing, typography, radius, shadows } from '../theme/tokens.ts';

/**
 * Common styling patterns and utilities
 */

export const commonStyles = {
  /**
   * Standard modal overlay styles
   */
  modalOverlay: (backgroundColor: string = 'rgba(0, 0, 0, 0.4)') => ({
    position: 'fixed' as const,
    inset: 0,
    backgroundColor,
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: spacing.md,
  }),

  /**
   * Standard modal content styles
   */
  modalContent: (maxWidth: number = 520, maxHeight: number = 720) => ({
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    boxShadow: shadows.cardElevated,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    maxWidth,
    maxHeight,
    width: '100%',
  }),

  /**
   * Modal header styles
   */
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.borderSecondary}30`,
  },

  /**
   * Modal title styles
   */
  modalTitle: {
    margin: 0,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.heading.join(', '),
  },

  /**
   * Modal close button styles
   */
  modalCloseButton: {
    position: 'absolute' as const,
    top: spacing.sm,
    right: spacing.sm,
    width: '34px',
    height: '34px',
    borderRadius: radius.full,
    border: `1px solid ${colors.borderSubtle}`,
    background: colors.surface2,
    color: colors.textPrimary,
    cursor: 'pointer',
    lineHeight: 1,
  },

  /**
   * Card hover effects
   */
  cardHover: {
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: shadows.cardElevated,
    },
  },

  /**
   * Button group styles
   */
  buttonGroup: {
    display: 'flex',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },

  /**
   * Form field styles
   */
  formField: {
    marginBottom: spacing.lg,
  },

  /**
   * Error text styles
   */
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },

  /**
   * Loading spinner overlay
   */
  loadingOverlay: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  /**
   * Gradient backgrounds
   */
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    danger: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    dark: 'linear-gradient(180deg, rgba(22,32,55,0.9) 0%, rgba(34,18,20,0.95) 100%)',
  },

  /**
   * Glass morphism effect
   */
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },

  /**
   * Text truncation utilities
   */
  textTruncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  textClamp: (lines: number) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  }),

  /**
   * Flex utilities
   */
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  flexColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
  },

  /**
   * Spacing utilities
   */
  spacing: {
    xs: { padding: spacing.xs },
    sm: { padding: spacing.sm },
    md: { padding: spacing.md },
    lg: { padding: spacing.lg },
    xl: { padding: spacing.xl },
    '2xl': { padding: spacing['2xl'] },
  },

  /**
   * Animation utilities
   */
  animations: {
    fadeIn: {
      animation: 'fadeIn 0.3s ease-out',
    },
    slideUp: {
      animation: 'slideUp 0.3s ease-out',
    },
    scaleIn: {
      animation: 'scaleIn 0.2s ease-out',
    },
  },
};

/**

/**
 * Theme-aware color utilities
 */
export const colorUtils = {
  /**
   * Get color with opacity
   */
  withOpacity: (color: string, opacity: number) => {
    // Simple opacity conversion (for hex colors)
    if (color.startsWith('#')) {
      const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
      return color + alpha;
    }
    return color;
  },

  /**
   * Get contrasting text color
   */
  getContrastColor: (bgColor: string) => {
    // Simple contrast calculation
    const color = bgColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  },
};

/**
 * Common layout patterns
 */
export const layouts = {
  /**
   * Centered container
   */
  centeredContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `0 ${spacing.md}`,
  },

  /**
   * Grid layout with consistent gaps
   */
  grid: (columns: number = 1, gap: string = spacing.md) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
  }),

  /**
   * Stack layout
   */
  stack: (gap: string = spacing.md) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap,
  }),

  /**
   * Inline stack
   */
  inlineStack: (gap: string = spacing.md) => ({
    display: 'flex',
    alignItems: 'center',
    gap,
  }),
};
