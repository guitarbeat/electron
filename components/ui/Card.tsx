import React from 'react';
import { colors, radius, shadows, borders } from '../../design-system/tokens';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  onClick?: () => void;
}

/**
 * Card component with retro 3D outset styling.
 */
const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  onClick 
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    border: `${borders.cardOutset} ${colors.border}`,
    boxShadow: shadows.card,
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out',
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick || variant === 'elevated') {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = shadows.cardHover;
          e.currentTarget.style.borderColor = colors.accentLight;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick || variant === 'elevated') {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = shadows.card;
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
    >
      {children}
    </div>
  );
};

export default Card;
