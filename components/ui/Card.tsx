import React from 'react';
import { colors, radius, shadows } from '../../design-system/tokens';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  onClick?: () => void;
}

/**
 * Card component providing consistent surface styling.
 */
const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  onClick 
}) => {
  const baseStyles = {
    backgroundColor: variant === 'elevated' ? colors.surfaceElevated : colors.surface,
    borderRadius: radius.lg,
    border: variant === 'outlined' ? `1px solid ${colors.border}` : 'none',
    boxShadow: variant === 'elevated' ? shadows.md : shadows.sm,
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const interactiveStyles = onClick ? {
    cursor: 'pointer',
    ':hover': {
      boxShadow: shadows.lg,
      borderColor: colors.borderHover,
    },
  } : {};

  return (
    <div
      className={className}
      style={{
        ...baseStyles,
        ...(onClick && {
          cursor: 'pointer',
        }),
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = shadows.lg;
          e.currentTarget.style.borderColor = colors.borderHover;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = variant === 'elevated' ? shadows.md : shadows.sm;
          e.currentTarget.style.borderColor = variant === 'outlined' ? colors.border : 'transparent';
        }
      }}
    >
      {children}
    </div>
  );
};

export default Card;
