import React, { useCallback, useEffect, useRef } from 'react';
import { typography } from '@/design-system';

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

const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
  }, []);

  const playTone = useCallback(
    (frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        } else {
          return;
        }
      }

      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    []
  );

  const playClick = useCallback(() => {
    playTone(800, 'sine', 0.05, 0.05);
  }, [playTone]);

  return { playClick };
};

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
        onClick={(event) => {
          if (!isDisabled) {
            playClick();
          }
          onClick?.(event);
        }}
        style={{
          fontFamily: typography.fontFamily.heading.join(', '),
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
