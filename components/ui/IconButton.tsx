import React from 'react';
import { colors, radius, spacing, motion } from '../../design-system/tokens';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'danger';
}

/**
 * Icon button component for icon-only actions.
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
      backgroundColor: colors.surfaceElevated,
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`,
      ':hover': {
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        borderColor: colors.borderHover,
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.textSecondary,
      border: 'none',
      ':hover': {
        backgroundColor: colors.surfaceElevated,
        color: colors.textPrimary,
      },
    },
    danger: {
      backgroundColor: 'transparent',
      color: colors.error,
      border: 'none',
      ':hover': {
        backgroundColor: colors.error + '20',
        color: colors.error,
      },
    },
  };

  const isDisabled = disabled;

  return (
    <button
      className={className}
      disabled={isDisabled}
      style={{
        padding: spacing.sm,
        borderRadius: radius.md,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: `all ${motion.duration.normal} ${motion.easing.easeOut}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          const hover = variantStyles[variant][':hover'];
          e.currentTarget.style.backgroundColor = hover.backgroundColor;
          e.currentTarget.style.color = hover.color;
          if (hover.borderColor) {
            e.currentTarget.style.borderColor = hover.borderColor;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor;
          e.currentTarget.style.color = variantStyles[variant].color;
          if (variantStyles[variant].border) {
            e.currentTarget.style.borderColor = colors.border;
          }
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
