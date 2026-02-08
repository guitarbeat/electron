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
    background: 'transparent',
    borderRadius: radius.card,
    border: 'none',
    boxShadow: 'none',
    position: 'relative',
    overflow: 'hidden',
    overflowY: 'auto',
    transition: 'none',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    minHeight: 'auto',
    backdropFilter: 'none',
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
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
