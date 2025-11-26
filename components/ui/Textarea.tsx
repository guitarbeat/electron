import React from 'react';
import { colors, radius, spacing, typography, motion, borders } from '../../design-system/tokens';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/**
 * Textarea component with retro inset styling.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  className = '',
  style,
  ...props
}, ref) => {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
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
        className={className}
        style={{
          width: '100%',
          padding: spacing.md,
          backgroundColor: '#162447',
          border: `${borders.inputInset} ${colors.borderInset}`,
          borderRadius: radius.sm,
          color: colors.textPrimary,
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.body.join(', '),
          lineHeight: typography.lineHeight.relaxed,
          transition: `all ${motion.duration.normal} ${motion.easing.easeOut}`,
          outline: 'none',
          resize: 'vertical',
          minHeight: '100px',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = `2px solid ${colors.accent}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
        }}
        {...props}
      />
      {error && (
        <div
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
});

Textarea.displayName = 'Textarea';

export default Textarea;
