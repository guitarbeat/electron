import React from 'react';
import { colors, radius, spacing, typography, motion, shadows, borders } from '../../design-system/tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Button component with retro 3D press effect.
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
      background: colors.gradientPink,
      color: colors.textPrimary,
      border: `${borders.buttonOutset} #fff`,
    },
    secondary: {
      background: colors.gradientBlue,
      color: colors.textPrimary,
      border: `${borders.buttonOutset} #fff`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.textSecondary,
      border: 'none',
    },
  };

  const isDisabled = disabled || isLoading;
  const isLarge = size === 'lg';

  return (
    <button
      className={className}
      disabled={isDisabled}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: radius.md,
        fontWeight: typography.fontWeight.normal,
        fontFamily: typography.fontFamily.heading.join(', '),
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: `all ${motion.duration.button} ${motion.easing.linear}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        boxShadow: variant === 'ghost' ? 'none' : (isLarge ? shadows.buttonLarge : shadows.button),
        textShadow: variant === 'ghost' ? 'none' : '1px 1px 3px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.4)',
        position: 'relative',
        top: 0,
        minHeight: size === 'lg' ? '48px' : size === 'md' ? '44px' : '36px', // * Better touch targets
        // Add subtle inner highlight
        backgroundImage: variant !== 'ghost' 
          ? `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`
          : 'none',
        ...style,
      }}
      onMouseDown={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.top = isLarge ? '6px' : '4px';
          e.currentTarget.style.boxShadow = isLarge 
            ? '0 0px 0 #000, 0 2px 0 rgba(255,255,255,0.3) inset, 0 0 20px rgba(0,0,0,0.5)'
            : shadows.buttonActive;
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.top = '0';
          e.currentTarget.style.boxShadow = isLarge ? shadows.buttonLarge : shadows.button;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.top = '0';
          e.currentTarget.style.boxShadow = isLarge ? shadows.buttonLarge : shadows.button;
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
