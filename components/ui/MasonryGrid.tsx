import React from 'react';
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
  columns = { mobile: 1, tablet: 2, desktop: 4 },
  gap = spacing.sm
}) => {
  const gridStyles = React.useMemo(() => `
    .masonry-grid {
      column-count: ${columns.desktop};
    }
    @media (max-width: 1024px) {
      .masonry-grid {
        column-count: ${columns.tablet};
      }
    }
    @media (max-width: 640px) {
      .masonry-grid {
        column-count: ${columns.mobile};
      }
    }
    .masonry-item {
      break-inside: avoid;
      margin-bottom: ${gap};
      display: inline-block;
      width: 100%;
    }
  `, [columns.desktop, columns.tablet, columns.mobile, gap]);

  return (
    <div 
      className="masonry-grid"
      style={{
        columnCount: columns.desktop,
        columnGap: gap,
        width: '100%',
      }}
    >
      <style>{gridStyles}</style>
      {React.Children.map(children, (child) => (
        <div className="masonry-item">
          {child}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
