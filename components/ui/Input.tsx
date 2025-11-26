import React from 'react';
import { colors, radius, spacing, typography, motion } from '../../design-system/tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Input component with consistent styling.
 */
const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  style,
  ...props
}) => {
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
          }}
        >
          {label}
        </label>
      )}
      <input
        className={className}
        style={{
          width: '100%',
          padding: spacing.md,
          backgroundColor: colors.surfaceElevated,
          border: `1px solid ${error ? colors.error : colors.border}`,
          borderRadius: radius.md,
          color: colors.textPrimary,
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.sans.join(', '),
          transition: `all ${motion.duration.normal} ${motion.easing.easeOut}`,
          outline: 'none',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? colors.error : colors.accent;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accentMuted}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? colors.error : colors.border;
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <div
          style={{
            marginTop: spacing.xs,
            fontSize: typography.fontSize.sm,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;
