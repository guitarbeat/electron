import React from 'react';
import { colors, spacing, typography } from '@/theme/tokens';

// ============================================================================
// CollectionEmptyState
// ============================================================================

interface CollectionEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: string;
}

const CollectionEmptyState: React.FC<CollectionEmptyStateProps> = ({
  padding = spacing['3xl'],
  className = '',
  style,
  children,
  ...props
}) => (
  <div
    className={className}
    style={{
      gridColumn: '1 / -1',
      textAlign: 'center',
      padding,
      color: colors.textTertiary,
      ...typography.presets.bodySm,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// CollectionGrid
// ============================================================================

interface CollectionGridProps extends React.HTMLAttributes<HTMLDivElement> {
  minColumnWidth?: string;
  gap?: string;
}

const CollectionGrid: React.FC<CollectionGridProps> = ({
  minColumnWidth = '280px',
  gap = spacing.lg,
  className = '',
  style,
  children,
  ...props
}) => (
  <div
    className={className}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`,
      gap,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// WorkspacePanels
// ============================================================================

interface WorkspacePanelsProps {
  first: React.ReactNode;
  second: React.ReactNode;
  desktopColumns?: string;
  gap?: string;
  mobileGap?: string;
  className?: string;
  firstClassName?: string;
  secondClassName?: string;
  stickyFirst?: boolean;
  stickyOffset?: string;
  firstAs?: React.ElementType;
  secondAs?: React.ElementType;
}

const WorkspacePanels: React.FC<WorkspacePanelsProps> = ({
  first,
  second,
  desktopColumns = 'minmax(280px, 320px) 1fr',
  gap = spacing.xl,
  mobileGap = gap,
  className = '',
  firstClassName = '',
  secondClassName = '',
  stickyFirst = false,
  stickyOffset = spacing.xl,
  firstAs: FirstTag = 'div',
  secondAs: SecondTag = 'div',
}) => {
  return (
    <div
      className={`workspace-layout ${className}`.trim()}
      style={
        {
          '--workspace-layout-columns': desktopColumns,
          '--workspace-layout-gap': gap,
          '--workspace-layout-mobile-gap': mobileGap,
        } as React.CSSProperties
      }
    >
      <FirstTag
        className={`workspace-layout__controls ${
          stickyFirst ? 'workspace-layout__controls--sticky' : ''
        } ${firstClassName}`.trim()}
        style={
          stickyFirst
            ? ({
                '--workspace-layout-sticky-offset': stickyOffset,
              } as React.CSSProperties)
            : undefined
        }
      >
        {first}
      </FirstTag>
      <SecondTag className={`workspace-layout__content ${secondClassName}`.trim()}>
        {second}
      </SecondTag>
    </div>
  );
};

export { CollectionEmptyState, CollectionGrid, WorkspacePanels };
