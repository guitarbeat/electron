import React, { useId, useState } from "react";
import {
  colors,
  radius,
  spacing,
  typography,
  motion,
  shadows,
} from "@/theme/tokens";

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
      className = "",
      style,
      id: providedId,
      fullWidth = true,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;

    return (
      <div
        className={`ui-input ${fullWidth ? "ui-input--full-width" : ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.xs,
          width: fullWidth ? "100%" : "auto",
        }}
      >
        {label && (
          <label
            htmlFor={id}
            style={{
              ...typography.presets.eyebrow,
              color: colors.textSecondary,
              fontSize: typography.fontSize["3xs"],
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`ui-input__field ${error ? "ui-input__field--error" : ""} ${className}`.trim()}
            style={{
              width: "100%",
              ...style,
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
        </div>
        {error && (
          <span
            id={errorId}
            style={{
              ...typography.presets.caption,
              color: colors.error,
              marginLeft: spacing.xs,
              marginTop: "1px",
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      fullWidth = true,
      onFocus,
      onBlur,
      style,
      id: providedId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: fullWidth ? "100%" : "auto",
        }}
      >
        {label && (
          <label
            htmlFor={id}
            style={{
              ...typography.presets.eyebrow,
              marginBottom: spacing.xs,
              color: isFocused ? colors.accent : colors.textSecondary,
              fontSize: typography.fontSize["3xs"],
              transition: `color ${motion.duration.fast} ${motion.easing.ease}`,
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="ui-textarea"
          style={{
            width: "100%",
            minHeight: "100px",
            padding: `${spacing.sm} ${spacing.md}`,
            background: isFocused
              ? `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 42%), ${colors.surface1}`
              : `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 42%), ${colors.surface0}`,
            color: colors.textPrimary,
            border: `1px solid ${error ? colors.error : isFocused ? colors.accent : colors.borderSubtle}`,
            borderRadius: radius.lg,
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamilyValue.body,
            lineHeight: typography.lineHeight.normal,
            outline: "none",
            resize: "vertical",
            transition: `all ${motion.duration.fast} ${motion.easing.ease}`,
            boxShadow: isFocused
              ? shadows.buttonActive
              : "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -8px 14px rgba(0,0,0,0.18)",
            ...style,
          }}
          {...props}
        />
        {error && (
          <span
            id={errorId}
            role="alert"
            style={{
              color: colors.error,
              fontSize: typography.fontSize["3xs"],
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
  },
);

Textarea.displayName = "Textarea";
