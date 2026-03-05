import React from 'react';
import { colors, radius, spacing, motion, borders } from '@/design-system/tokens;

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Icon button component with retro styling.
 */
const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'default',
  className = '',
  disabled,
  style,
  type = 'button',
  ...props
}) => {
  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
      color: colors.textSecondary,
      border: `${borders.iconOutset} ${colors.borderTertiary}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.textSecondary,
      border: 'none',
    },
    danger: {
      backgroundColor: 'transparent',
      color: colors.error,
      border: 'none',
    },
  };

  const isDisabled = disabled;

  return (
    <button
      type={type}
      className={className}
      disabled={isDisabled}
      style={{
        padding: spacing.sm,
        borderRadius: radius.sm,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: `all ${motion.duration.fast} ${motion.easing.easeInOut}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '44px', // * Better touch target for mobile
        minHeight: '44px',
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = `${colors.tertiaryHover}40`;
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = colors.surfaceElevated;
            e.currentTarget.style.color = colors.textPrimary;
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = `${colors.error}20`;
            e.currentTarget.style.opacity = '0.9';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor;
          e.currentTarget.style.color = variantStyles[variant].color;
          if (variant === 'danger') {
            e.currentTarget.style.opacity = '1';
          }
        }
      }}
      onMouseDown={(e) => {
        if (!isDisabled && variant === 'default') {
          e.currentTarget.style.borderStyle = 'inset';
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled && variant === 'default') {
          e.currentTarget.style.borderStyle = 'outset';
        }
      }}
      onFocus={(e) => {
        if (!isDisabled) {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = `${colors.tertiaryHover}40`;
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = colors.surfaceElevated;
            e.currentTarget.style.color = colors.textPrimary;
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = `${colors.error}20`;
            e.currentTarget.style.opacity = '0.9';
          }
        }
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor;
          e.currentTarget.style.color = variantStyles[variant].color;
          if (variant === 'danger') {
            e.currentTarget.style.opacity = '1';
          }
        }
        props.onBlur?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
