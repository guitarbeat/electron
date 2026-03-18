import React, { useId } from 'react';
import { colors, radius, spacing, typography, motion } from '@/design-system';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', style, id: providedId, fullWidth = true, ...props }, ref) => {
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
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.surface0,
              border: `1.5px solid ${error ? colors.error : colors.borderSubtle}`,
              borderRadius: radius.md,
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.body.join(', '),
              fontSize: typography.fontSize.base,
              transition: `all ${motion.duration.fast} ${motion.easing.ease}`,
              outline: 'none',
              ...style,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accentMuted}`;
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = colors.borderSubtle;
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
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

export default Input;


Input.displayName = 'Input';

export default Input;
