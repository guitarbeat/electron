import React from 'react';
import { colors, radius, shadows, motion } from '@/design-system';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
  hover?: boolean;
  glow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
  hover = false,
  glow = false,
  style,
  role,
  tabIndex,
  onKeyDown,
  ...props
}) => {
  const isInteractive = typeof onClick === 'function' || variant === 'interactive';

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface2,
          boxShadow: shadows.cardElevated,
          border: `1.5px solid ${colors.borderSecondary}45`,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          border: `1.5px solid ${colors.borderSubtle}`,
          boxShadow: 'none',
        };
      case 'interactive':
      case 'default':
      default:
        return {
          backgroundColor: colors.surface1,
          boxShadow: shadows.card,
          border: `1.5px solid ${colors.borderSubtle}`,
        };
    }
  };

  return (
    <div
      className={`ui-card ui-card--${variant} ${hover ? 'ui-card--hover' : ''} ${
        glow ? 'ui-card--glow' : ''
      } ${isInteractive ? 'ui-card--interactive' : ''} ${className}`.trim()}
      role={isInteractive ? role || 'button' : role}
      tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
      style={{
        position: 'relative',
        borderRadius: radius.card,
        overflow: 'hidden',
        transition: `all ${motion.duration.normal} ${motion.easing.ease}`,
        cursor: isInteractive ? 'pointer' : 'default',
        padding: '1.25rem',
        ...getVariantStyles(),
        ...(glow && { boxShadow: shadows.glow }),
        ...style,
      }}
      onClick={onClick}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!isInteractive || event.defaultPrevented) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      {...props}
    >
      {/* Subtle shine effect for interactive cards */}
      {isInteractive && (
        <div
          className="ui-card__shine"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)',
            pointerEvents: 'none',
            opacity: 0.5,
          }}
        />
      )}
      {children}
    </div>
  );
};

export default Card;

