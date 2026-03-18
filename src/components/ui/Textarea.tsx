import React, { useState } from 'react';
import { colors, spacing, typography, radius, motion, shadows } from '@/design-system';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
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

export default Textarea;
