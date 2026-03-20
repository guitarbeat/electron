import React from 'react';
import { colors, spacing, typography } from '@/design-system';

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
  isMobile?: boolean;
  first: React.ReactNode;
  second: React.ReactNode;
  desktopColumns?: string;
  gap?: string;
  mobileGap?: string;
  className?: string;
  mobileClassName?: string;
  firstClassName?: string;
  secondClassName?: string;
  stickyFirst?: boolean;
  stickyOffset?: string;
  firstAs?: React.ElementType;
  secondAs?: React.ElementType;
}

const WorkspacePanels: React.FC<WorkspacePanelsProps> = ({
  isMobile = false,
  first,
  second,
  desktopColumns = 'minmax(280px, 320px) 1fr',
  gap = spacing.xl,
  mobileGap = gap,
  className = '',
  mobileClassName = '',
  firstClassName = '',
  secondClassName = '',
  stickyFirst = false,
  stickyOffset = spacing.xl,
  firstAs: FirstTag = 'div',
  secondAs: SecondTag = 'div',
}) => {
  if (isMobile) {
    return (
      <div
        className={`workspace-layout--mobile ${mobileClassName}`.trim()}
        style={{ gap: mobileGap }}
      >
        <FirstTag className={firstClassName}>{first}</FirstTag>
        <SecondTag className={secondClassName}>{second}</SecondTag>
      </div>
    );
  }

  return (
    <div
      className={`workspace-layout ${className}`.trim()}
      style={{
        display: 'grid',
        gridTemplateColumns: desktopColumns,
        gap,
        alignItems: 'start',
      }}
    >
      <FirstTag
        className={`workspace-layout__controls ${firstClassName}`.trim()}
        style={
          stickyFirst
            ? {
                position: 'sticky',
                top: stickyOffset,
                height: 'fit-content',
              }
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
