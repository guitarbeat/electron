import React, { useRef, useEffect, useState } from "react";

export interface MagicToggleOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Used when label is icon-only or abbreviated on small screens. */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

interface MagicToggleProps<T extends string> {
  options: MagicToggleOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

function MagicToggle<T extends string>({
  options,
  activeValue,
  onChange,
  ariaLabel,
}: MagicToggleProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const activeIndex = options.findIndex((opt) => opt.value === activeValue);
    if (activeIndex === -1) return;

    const buttons = containerRef.current.querySelectorAll(".magic-toggle__btn");
    const activeButton = buttons[activeIndex] as HTMLButtonElement | undefined;

    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeValue, options]);

  return (
    <div
      className="magic-toggle"
      role="group"
      aria-label={ariaLabel}
      ref={containerRef}
    >
      <div
        className={`magic-toggle__indicator ${options.find((opt) => opt.value === activeValue)?.className?.includes("is-logout") ? "is-logout" : ""}`}
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
        }}
        aria-hidden="true"
      />
      {options.map((option) => {
        const isActive = activeValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`magic-toggle__btn ${isActive ? "is-active" : ""} ${option.disabled ? "is-disabled" : ""} ${option.className || ""}`.trim()}
            disabled={option.disabled}
            onPointerDown={(e) => {
              e.preventDefault();
              onChange(option.value);
            }}
            aria-pressed={isActive}
            aria-label={option.ariaLabel}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default MagicToggle;
