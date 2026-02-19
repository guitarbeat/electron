import React from 'react';
import {
  colors,
  radius,
  spacing,
  typography,
  motion,
  shadows,
  borders,
} from '../../design-system/tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * Button component with retro 3D press effect.
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  children,
  className = '',
  style,
  type = 'button',
  ...props
}) => {
  const sizeStyles = {
    sm: {
      padding: `${spacing.xs} ${spacing.md}`,
      fontSize: typography.fontSize.xs,
    },
    md: {
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.fontSize.sm,
    },
    lg: {
      padding: `${spacing.md} ${spacing.xl}`,
      fontSize: typography.fontSize.base,
    },
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundImage: `${colors.gradientPink}, linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 50%, transparent 100%)`,
          color: colors.textPrimary,
          border: `${borders.buttonOutset} #fff`,
        };
      case 'secondary':
        return {
          backgroundImage: `${colors.gradientBlue}, linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 50%, transparent 100%)`,
          color: colors.textPrimary,
          border: `${borders.buttonOutset} #fff`,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          color: colors.textPrimary,
          border: `${borders.buttonOutset} #fff`,
        };
      case 'ghost':
      default:
        return {
          backgroundColor: 'transparent',
          color: colors.textSecondary,
          border: 'none',
        };
    }
  };

  const isDisabled = disabled || isLoading;
  const isLarge = size === 'lg';

  return (
    <button
      type={type}
      className={`${className} ripple-effect`}
      disabled={isDisabled}
      style={{
        ...sizeStyles[size],
        ...getVariantStyles(),
        borderRadius: radius.md,
        fontWeight: typography.fontWeight.medium,
        fontFamily: typography.fontFamily.heading.join(', '),
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: `all ${motion.duration.normal} ${motion.easing.easeOut}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        boxShadow: variant === 'ghost' ? 'none' : isLarge ? shadows.buttonLarge : shadows.button,
        textShadow:
          variant === 'ghost' ? 'none' : '1px 1px 3px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.4)',
        position: 'relative',
        top: 0,
        minHeight: size === 'lg' ? '44px' : size === 'md' ? '36px' : '32px',
        overflow: 'hidden',
        letterSpacing: '0.03em',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.filter = 'brightness(1)';
          e.currentTarget.style.top = '0';
          e.currentTarget.style.boxShadow = isLarge ? shadows.buttonLarge : shadows.button;
        }
      }}
      onMouseDown={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.top = isLarge ? '6px' : '4px';
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
          e.currentTarget.style.boxShadow = isLarge
            ? '0 0px 0 #000, 0 2px 0 rgba(255,255,255,0.3) inset, 0 0 20px rgba(0,0,0,0.5)'
            : shadows.buttonActive;
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.top = '0';
          e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
          e.currentTarget.style.boxShadow = isLarge ? shadows.buttonLarge : shadows.button;
        }
      }}
      onFocus={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.filter = 'brightness(1)';
          e.currentTarget.style.top = '0';
          e.currentTarget.style.boxShadow = isLarge ? shadows.buttonLarge : shadows.button;
        }
        props.onBlur?.(e);
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
          {loadingText ? <span>{loadingText}</span> : <span className="sr-only">Loading</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
