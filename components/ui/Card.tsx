import React from 'react';
import { colors, radius, shadows, borders } from '../../design-system/tokens';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Card component with retro 3D outset styling.
 */
const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  onClick,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    background: variant === 'elevated' ? colors.gradientCard : colors.surface,
    borderRadius: radius.card,
    border: `${borders.cardOutset} ${colors.border}`,
    boxShadow: variant === 'elevated' ? shadows.cardElevated : shadows.card,
    position: 'relative',
    overflow: 'hidden',
    overflowY: 'auto',
    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease-out, border-color 0.25s ease-out',
    backgroundImage: variant === 'elevated' 
      ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 50%, transparent 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    minHeight: 'auto',
    backdropFilter: 'blur(8px)',
    ...style
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    // * Detect mobile devices to disable hover effects
    const isMobile = window.matchMedia('(max-width: 640px)').matches;

    if (!isMobile && (onClick || variant === 'elevated')) {
      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
      e.currentTarget.style.boxShadow = shadows.cardHover;
      e.currentTarget.style.borderColor = colors.accentLight;
      e.currentTarget.style.backgroundImage = variant === 'elevated'
        ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)';
    }

    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const isMobile = window.matchMedia('(max-width: 640px)').matches;

    if (!isMobile && (onClick || variant === 'elevated')) {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = variant === 'elevated' ? shadows.cardElevated : shadows.card;
      e.currentTarget.style.borderColor = colors.border;
      e.currentTarget.style.backgroundImage = variant === 'elevated'
        ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)';
    }

    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
