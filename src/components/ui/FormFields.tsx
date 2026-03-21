import React, { useId, useState } from 'react';
import { colors, spacing, typography, motion, shadows } from '@/design-system';

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = '',
      style,
      id: providedId,
      fullWidth = true,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;

    return (
      <div
        className={`ui-input ${fullWidth ? 'ui-input--full-width' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
          width: fullWidth ? '100%' : 'auto',
        }}
      >
        {label && (
          <label
            htmlFor={id}
            className="ui-input__label"
            style={{
              ...typography.presets.eyebrow,
              color: colors.textSecondary,
              marginLeft: spacing.xs,
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`ui-input__field ${error ? 'ui-input__field--error' : ''} ${className}`.trim()}
            style={{
              width: '100%',
              ...style,
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
        </div>
        {error && (
          <div
            id={errorId}
            role="alert"
            className="ui-input__error"
            style={{
              ...typography.presets.caption,
              color: colors.error,
              marginLeft: spacing.xs,
              marginTop: '1px',
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = true, onFocus, onBlur, style, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'auto' }}>
        {label && (
          <label
            style={{
              ...typography.presets.eyebrow,
              marginBottom: spacing.xs,
              color: isFocused ? colors.accent : colors.textSecondary,
              fontSize: typography.fontSize['3xs'],
              transition: `color ${motion.duration.fast} ${motion.easing.ease}`,
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: isFocused ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.25)',
            color: colors.textPrimary,
            border: `1px solid ${error ? colors.error : isFocused ? colors.accent : colors.borderSubtle}`,
            borderRadius: radius.md,
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamilyValue.body,
            lineHeight: typography.lineHeight.normal,
            outline: 'none',
            resize: 'vertical',
            transition: `all ${motion.duration.fast} ${motion.easing.ease}`,
            boxShadow: isFocused ? shadows.buttonActive : 'inset 0 2px 4px rgba(0,0,0,0.1)',
            ...style,
          }}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <span
            style={{
              color: colors.error,
              fontSize: typography.fontSize['3xs'],
              marginTop: spacing.xs,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamilyValue.body,
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
