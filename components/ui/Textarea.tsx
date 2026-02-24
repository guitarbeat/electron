import React from 'react';
import { colors, radius, spacing, typography, motion, borders } from '../../design-system/tokens';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/**
 * Textarea component with retro inset styling.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', style, id: idProp, 'aria-label': ariaLabel, ...props }, ref) => {
    const id = idProp ?? (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label
            htmlFor={id}
            style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-label={!label ? ariaLabel : undefined}
          className={className}
          style={{
            width: '100%',
            padding: spacing.md,
            backgroundColor: '#162447',
            border: `${borders.inputInset} ${colors.borderInset}`,
            borderRadius: radius.md,
            color: colors.textPrimary,
            fontSize: typography.fontSize.base, // * 16px prevents iOS zoom
            fontFamily: typography.fontFamily.body.join(', '),
            lineHeight: typography.lineHeight.relaxed,
            transition: `all ${motion.duration.normal} ${motion.easing.easeOut}`,
            outline: 'none',
            resize: 'vertical',
            minHeight: '100px',
            WebkitAppearance: 'none', // * Prevent iOS default styling
            textAlign: 'left',
            letterSpacing: '0.02em',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = `2px solid ${colors.accent}`;
            e.currentTarget.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 2px ${colors.accent}40`;
            e.currentTarget.style.borderColor = colors.accent;
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';
            e.currentTarget.style.borderColor = colors.borderInset;
          }}
          {...props}
        />
        {error && (
          <div
            id={errorId}
            role="alert"
            style={{
              marginTop: spacing.xs,
              fontSize: typography.fontSize.sm,
              color: colors.error,
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
