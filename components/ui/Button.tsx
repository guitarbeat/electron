import React from 'react';
import { colors, radius, spacing, typography, motion } from '../../design-system/tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Button component with consistent styling and interaction states.
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  style,
  ...props
}) => {
  const sizeStyles = {
    sm: {
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.fontSize.sm,
    },
    md: {
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: typography.fontSize.base,
    },
    lg: {
      padding: `${spacing.lg} ${spacing.xl}`,
      fontSize: typography.fontSize.lg,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.accent,
      color: colors.textPrimary,
      border: 'none',
      ':hover': {
        backgroundColor: colors.accentHover,
      },
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.textPrimary,
      border: 'none',
      ':hover': {
        backgroundColor: colors.secondaryHover,
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`,
      ':hover': {
        backgroundColor: colors.surfaceElevated,
        color: colors.textPrimary,
      },
    },
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={className}
      disabled={isDisabled}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: radius.md,
        fontWeight: typography.fontWeight.medium,
        fontFamily: typography.fontFamily.sans.join(', '),
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: `all ${motion.duration.normal} ${motion.easing.easeOut}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        border: variantStyles[variant].border || 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant][':hover'].backgroundColor;
          if (variant === 'ghost') {
            e.currentTarget.style.color = colors.textPrimary;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor || 'transparent';
          if (variant === 'ghost') {
            e.currentTarget.style.color = colors.textSecondary;
          }
        }
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin"
            style={{ width: '1em', height: '1em' }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
