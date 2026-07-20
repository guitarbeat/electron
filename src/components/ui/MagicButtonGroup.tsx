import React from "react";
import "./MagicButtonGroup.css";

export interface MagicButtonGroupOption<T extends string> {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

interface MagicButtonGroupProps<T extends string> {
  options: MagicButtonGroupOption<T>[];
  onClick: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

function MagicButtonGroup<T extends string>({
  options,
  onClick,
  ariaLabel,
  className = "",
}: MagicButtonGroupProps<T>) {
  return (
    <div
      className={`magic-button-group ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`magic-button-group__btn ${option.className || ""}`.trim()}
          disabled={option.disabled}
          onClick={() => onClick(option.value)}
          aria-label={option.ariaLabel}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default MagicButtonGroup;
