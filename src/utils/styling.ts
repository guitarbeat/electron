import { colors, spacing, typography, radius, shadows } from '../theme/tokens.ts';

/**
 * Responsive breakpoints utility
 */
export const breakpoints = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
};

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
