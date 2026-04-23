import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
  hover?: boolean;
  glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({
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
}, ref) => {
  const isInteractive = typeof onClick === 'function' || variant === 'interactive';

  return (
    <div
      ref={ref}
      className={`ui-card ui-card--${variant} ${hover ? 'ui-card--hover' : ''} ${
        glow ? 'ui-card--glow' : ''
      } ${isInteractive ? 'ui-card--interactive' : ''} ${className}`.trim()}
      role={isInteractive ? role || 'button' : role}
      tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: isInteractive ? 'pointer' : 'default',
        padding: '1.25rem',
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
});

Card.displayName = 'Card';

export default Card;
