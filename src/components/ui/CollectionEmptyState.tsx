import React from 'react';
import { colors, spacing, typography } from '@/design-system';

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

export default CollectionEmptyState;
