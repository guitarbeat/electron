import React, { useEffect, useState } from 'react';
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
    overflow: 'hidden',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    // Add subtle inner highlight
    backgroundImage: variant === 'elevated' 
      ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onClick={onClick}
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
