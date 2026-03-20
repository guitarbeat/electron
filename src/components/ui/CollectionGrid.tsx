import React from 'react';
import { spacing } from '@/design-system';

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

export default CollectionGrid;
