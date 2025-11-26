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
    background: variant === 'elevated' ? colors.gradientCard : colors.surface,
    borderRadius: radius.card,
    border: `${borders.cardOutset} ${colors.border}`,
    boxShadow: variant === 'elevated' ? shadows.cardElevated : shadows.card,
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out',
    // Add subtle inner highlight
    backgroundImage: variant === 'elevated' 
      ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick || variant === 'elevated') {
          e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
          e.currentTarget.style.boxShadow = shadows.cardHover;
          e.currentTarget.style.borderColor = colors.accentLight;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick || variant === 'elevated') {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = variant === 'elevated' ? shadows.cardElevated : shadows.card;
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
    >
      {children}
    </div>
  );
};

export default Card;
