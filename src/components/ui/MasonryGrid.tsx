import React from 'react';
import { spacing } from '@/design-system/tokens';
import './MasonryGrid.css';

interface MasonryGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({
  children,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = spacing.sm,
}) => {
  const gridVariables = {
    '--masonry-cols-mobile': String(columns.mobile ?? 2),
    '--masonry-cols-tablet': String(columns.tablet ?? 3),
    '--masonry-cols-desktop': String(columns.desktop ?? 4),
    '--masonry-gap': gap,
  } as React.CSSProperties;

  return (
    <div className="masonry-grid" style={gridVariables}>
      {React.Children.map(children, (child) => (
        <div className="masonry-item">{child}</div>
      ))}
    </div>
  );
};

export default MasonryGrid;
