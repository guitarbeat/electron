import { useRef, useEffect, useState } from "react";
import "./MagicToggle.css";

export interface MagicToggleOption<T extends string> {
  value: T;
  label: string;
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
        className="magic-toggle__indicator"
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
            className={`magic-toggle__btn ${isActive ? "is-active" : ""}`}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default MagicToggle;
