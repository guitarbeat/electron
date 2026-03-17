import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
  style,
  role,
  tabIndex,
  onKeyDown,
  ...props
}) => {
  const isInteractive = typeof onClick === 'function';

  return (
    <div
      className={`ui-card ui-card--${isInteractive && variant === 'default' ? 'interactive' : variant} ${className}`.trim()}
      role={isInteractive ? role || 'button' : role}
      tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
      style={{
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
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
      {children}
    </div>
  );
};

export default Card;
