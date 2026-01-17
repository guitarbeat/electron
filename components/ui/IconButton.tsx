import React from 'react';
import { colors, radius, spacing, motion, borders } from '../../design-system/tokens';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'danger';
  'aria-label': string;
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
        outline: 'none', // Remove default outline to use custom focus styles
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = colors.tertiaryHover + '40';
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = colors.surfaceElevated;
            e.currentTarget.style.color = colors.textPrimary;
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = colors.error + '20';
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
          e.currentTarget.style.outline = `2px solid ${colors.accent}`;
          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`;
          // For default variant, we might want to keep the border color unless we want to override it
          if (variant === 'default') {
            e.currentTarget.style.borderColor = colors.accent;
          }
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
        e.currentTarget.style.boxShadow = 'none';
        // Reset border color for default variant
        if (variant === 'default') {
          e.currentTarget.style.borderColor = colors.borderTertiary;
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
