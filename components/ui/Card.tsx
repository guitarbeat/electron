import React, { useEffect, useState } from 'react';
import { colors, radius, shadows, borders } from '../../design-system/tokens';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
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
  ...props
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // * Detect mobile devices to disable hover effects
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    };
    
    checkMobile();
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    mediaQuery.addEventListener('change', checkMobile);
    
    return () => {
      mediaQuery.removeEventListener('change', checkMobile);
    };
  }, []);

  const baseStyles: React.CSSProperties = {
    background: variant === 'elevated' ? colors.gradientCard : colors.surface,
    borderRadius: radius.card,
    border: `${borders.cardOutset} ${colors.border}`,
    boxShadow: variant === 'elevated' ? shadows.cardElevated : shadows.card,
    position: 'relative',
    overflow: 'hidden', // * Keep hidden for decorative element clipping
    overflowY: 'auto', // * Allow vertical scrolling if content exceeds height, but prefer wrapping
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    // Add subtle inner highlight
    backgroundImage: variant === 'elevated' 
      ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
    // * Ensure text wrapping - text should wrap within the card's width
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    minHeight: 'auto', // * Allow card to grow to fit content
  };

  return (
    <div
      className={className}
      style={{ ...baseStyles, ...style }}
      onClick={onClick}
      {...props}
      onMouseEnter={(e) => {
        if (!isMobile && (onClick || variant === 'elevated')) {
          e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
          e.currentTarget.style.boxShadow = shadows.cardHover;
          e.currentTarget.style.borderColor = colors.accentLight;
          e.currentTarget.style.backgroundImage = variant === 'elevated'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile && (onClick || variant === 'elevated')) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = variant === 'elevated' ? shadows.cardElevated : shadows.card;
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.backgroundImage = variant === 'elevated'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)';
        }
      }}
    >
      {children}
    </div>
  );
};

export default Card;
