import React from 'react';
import { colors, radius, spacing, typography, motion, borders } from '../../design-system/tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Input component with retro inset styling.
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
            fontFamily: typography.fontFamily.body.join(', '),
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
          backgroundColor: '#162447',
          border: `${borders.inputInset} ${colors.borderInset}`,
          borderRadius: radius.sm,
          color: colors.textPrimary,
          fontSize: typography.fontSize.base, // * 16px prevents iOS zoom
          fontFamily: typography.fontFamily.body.join(', '),
          transition: `all ${motion.duration.normal} ${motion.easing.easeOut}`,
          outline: 'none',
          WebkitAppearance: 'none', // * Prevent iOS default styling
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
};

export default Input;
