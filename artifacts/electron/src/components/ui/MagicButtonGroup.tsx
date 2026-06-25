import React from "react";
import "./MagicToggle.css"; // Reuse magic-toggle styles for consistency

export interface MagicButtonOption {
  id: string;
  label: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
}

interface MagicButtonGroupProps {
  options: MagicButtonOption[];
  ariaLabel?: string;
  ariaPressed?: boolean;
}

function MagicButtonGroup({
  options,
  ariaLabel,
}: MagicButtonGroupProps) {
  return (
    <div
      className="magic-toggle"
      role="group"
      aria-label={ariaLabel}
    >
      {/* Intentionally no moving indicator because these are disjointed actions, not a mutually exclusive selection */}
      {options.map((option) => {
        return (
          <button
            key={option.id}
            type="button"
            className={`magic-toggle__btn ${option.disabled ? "is-disabled" : ""} ${option.className || ""}`.trim()}
            disabled={option.disabled}
            onClick={option.onClick}
            aria-label={option.ariaLabel}
            aria-pressed={option.ariaPressed}
            title={option.title}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default MagicButtonGroup;
