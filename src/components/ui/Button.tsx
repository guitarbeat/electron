import React from 'react';
import { typography, colors, motion, radius, shadows } from '@/design-system';
import { useAudio } from '@/hooks/useAudio';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText = 'Loading...',
      disabled,
      children,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      style,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const { playClick } = useAudio();
    const isDisabled = disabled || isLoading;
    const buttonType = type === 'submit' ? 'submit' : type === 'reset' ? 'reset' : 'button';

    const getVariantStyles = () => {
      switch (variant) {
        case 'secondary':
          return {
            background: colors.secondary,
            color: '#1a1a2e',
            border: 'none',
            boxShadow: shadows.button,
          };
        case 'danger':
          return {
            background: colors.error,
            color: '#fff',
            border: 'none',
            boxShadow: shadows.button,
          };
        case 'ghost':
          return {
            background: 'transparent',
            color: colors.textSecondary,
            border: `1px solid ${colors.borderSubtle}`,
            boxShadow: 'none',
          };
        case 'primary':
        default:
          return {
            background: colors.accent,
            color: '#1a1a2e',
            border: 'none',
            boxShadow: shadows.button,
          };
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            padding: '0.4rem 0.8rem',
            fontSize: typography.fontSize.xs,
          };
        case 'lg':
          return {
            padding: '0.82rem 1.75rem',
            fontSize: typography.fontSize.lg,
          };
        case 'md':
        default:
          return {
            padding: '0.62rem 1.25rem',
            fontSize: typography.fontSize.base,
          };
      }
    };

    return (
      <button
        ref={ref}
        type={buttonType}
        className={`ui-button ui-button--${variant} ui-button--${size} ripple-effect ${
          isDisabled ? 'ui-button--disabled' : ''
        } ${fullWidth ? 'ui-button--full-width' : ''} ${className}`}
        disabled={isDisabled}
        onClick={(event) => {
          if (!isDisabled) {
            playClick();
          }
          onClick?.(event);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.55rem',
          borderRadius: radius.md,
          fontFamily: typography.fontFamily.heading.join(', '),
          fontWeight: typography.fontWeight.semibold,
          letterSpacing: typography.letterSpacing.button,
          textTransform: 'uppercase',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: `all ${motion.duration.button} ${motion.easing.ease}`,
          opacity: isDisabled ? 0.6 : 1,
          width: fullWidth ? '100%' : 'auto',
          ...getVariantStyles(),
          ...getSizeStyles(),
          ...style,
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
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
              <path
                fill="currentColor"
                opacity="0.75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText ? <span>{loadingText}</span> : <span className="sr-only">Loading</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="ui-button__icon ui-button__icon--left">{leftIcon}</span>}
            <span className="ui-button__content">{children}</span>
            {rightIcon && <span className="ui-button__icon ui-button__icon--right">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

