import React from 'react';
import './MasonryGrid.css';
import { spacing } from '../../design-system/tokens';

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
  return (
    <div
      className="masonry-grid"
      style={
        {
          '--masonry-gap': gap,
          '--masonry-columns-desktop': columns.desktop,
          '--masonry-columns-tablet': columns.tablet,
          '--masonry-columns-mobile': columns.mobile,
        } as React.CSSProperties
      }
    >
      {React.Children.map(children, (child) => (
        <div className="masonry-item">{child}</div>
      ))}
    </div>
  );
};

export default MasonryGrid;
