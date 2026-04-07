import { spacing } from '../theme/tokens.ts';

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

  /**
   * Flex row layout
   */
  flexRow: (justifyContent: string = 'flex-start', alignItems: string = 'center', gap: string = spacing.md) => ({
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent,
    alignItems,
    gap,
  }),

  /**
   * Flex column layout
   */
  flexColumn: (justifyContent: string = 'flex-start', alignItems: string = 'stretch', gap: string = spacing.md) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent,
    alignItems,
    gap,
  }),

  /**
   * Space between layout
   */
  spaceBetween: (direction: 'row' | 'column' = 'row', gap: string = spacing.md) => ({
    display: 'flex',
    flexDirection: direction,
    justifyContent: 'space-between',
    alignItems: direction === 'row' ? 'center' : 'stretch',
    gap,
  }),
};
