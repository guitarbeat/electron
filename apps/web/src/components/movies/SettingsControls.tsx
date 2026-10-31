import React from "react";
import { playXmbSelect } from "@/services/xmbAudio";

export interface SegmentOption<T extends string> {
  value: T;
  content: React.ReactNode;
  ariaLabel?: string;
  title?: string;
  /** Zero-count options recede but stay reachable. */
  empty?: boolean;
  autofocus?: boolean;
}

/**
 * Segmented pills with one highlight that glides to the chosen option. `radio` always has one
 * choice; `toggle` lets the chosen option be pressed again to clear it.
 */
export function SlidingSegments<T extends string>({
  label,
  options,
  value,
  onSelect,
  mode = "radio",
  className = "",
}: {
  label: string;
  options: Array<SegmentOption<T>>;
  value: T | null;
  onSelect: (value: T) => void;
  mode?: "radio" | "toggle";
  className?: string;
}) {
  const groupRef = React.useRef<HTMLDivElement | null>(null);
  const [pill, setPill] = React.useState<{ x: number; w: number } | null>(null);

  React.useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const active = group.querySelector<HTMLElement>('[data-segment-active="true"]');
      setPill(active ? { x: active.offsetLeft, w: active.offsetWidth } : null);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [value, options.length]);

  return (
    <div
      ref={groupRef}
      className={`settings-menu__seg${className ? ` ${className}` : ""}`}
      role={mode === "radio" ? "radiogroup" : "group"}
      aria-label={label}
      style={pill ? ({ "--pill-x": `${pill.x}px`, "--pill-w": `${pill.w}px` } as React.CSSProperties) : undefined}
      data-has-pill={pill ? "true" : "false"}
    >
      <span className="settings-menu__pill" aria-hidden="true" />
      {options.map((option) => {
        const selected = option.value === value;
        const state = mode === "radio"
          ? { role: "radio", "aria-checked": selected }
          : { "aria-pressed": selected };
        return (
          <button
            key={option.value}
            type="button"
            className={`settings-menu__opt${selected ? " is-active" : ""}${option.empty ? " is-empty" : ""}`}
            data-segment-active={selected ? "true" : undefined}
            aria-label={option.ariaLabel}
            title={option.title}
            {...state}
            {...(option.autofocus ? { "data-tv-autofocus": "" } : {})}
            onClick={() => onSelect(option.value)}
          >
            {option.content}
          </button>
        );
      })}
    </div>
  );
}

/** A pixel-style on/off switch whose knob slides across a little track. */
export function SettingsSwitch({
  label,
  checked,
  onChange,
  silent = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Skip the select cue when the change already plays its own sound. */
  silent?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`settings-switch${checked ? " is-on" : ""}`}
      onClick={() => {
        if (!silent) playXmbSelect();
        onChange(!checked);
      }}
    >
      <span className="settings-switch__track" aria-hidden="true">
        <span className="settings-switch__knob" />
      </span>
      <span className="settings-switch__label">{label}</span>
    </button>
  );
}
