import React from 'react';
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

    return (
      <button
        ref={ref}
        type={buttonType}
        className={`ui-button ui-button--${variant} ui-button--${size} ripple-effect ${
          isDisabled ? 'ui-button--disabled' : ''
        } ${fullWidth ? 'ui-button--full-width' : ''} ${className}`}
        disabled={isDisabled}
        aria-busy={isLoading}
        onClick={(event) => {
          if (!isDisabled) {
            playClick();
          }
          onClick?.(event);
        }}
        style={{
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
