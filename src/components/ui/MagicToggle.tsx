import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface MagicToggleOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface MagicToggleProps<T extends string> {
  options: readonly MagicToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function MagicToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
}: MagicToggleProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [hoveredValue, setHoveredValue] = useState<T | null>(null);

  useEffect(() => {
    if (!containerRef.current || !indicatorRef.current) return;

    const buttons = Array.from(containerRef.current.querySelectorAll('button'));
    const activeBtn = buttons.find(b => b.dataset.value === value);

    if (activeBtn) {
      const parentRect = containerRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      gsap.to(indicatorRef.current, {
        x: btnRect.left - parentRect.left,
        width: btnRect.width,
        height: btnRect.height,
        duration: 0.5,
        ease: 'elastic.out(1, 0.6)',
      });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={`magic-toggle ${className}`}
      role="group"
      aria-label={ariaLabel}
      style={{
        position: 'relative',
        display: 'inline-flex',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: '99px',
        padding: '4px',
        gap: '4px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        ref={indicatorRef}
        style={{
          position: 'absolute',
          top: '4px',
          left: 0,
          background: 'var(--color-bg-primary, #ffffff)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          borderRadius: '99px',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            data-value={opt.value}
            disabled={opt.disabled}
            style={{
              position: 'relative',
              zIndex: 2,
              border: 'none',
              background: 'transparent',
              padding: '6px 16px',
              borderRadius: '99px',
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive
                ? 'var(--color-text-primary, #000)'
                : opt.disabled
                  ? 'var(--color-text-tertiary, #999)'
                  : 'var(--color-text-secondary, #666)',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: opt.disabled ? 0.4 : 1,
              transform: hoveredValue === opt.value && !opt.disabled && !isActive ? 'scale(1.02)' : 'scale(1)',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!opt.disabled) onChange(opt.value);
            }}
            onMouseEnter={() => setHoveredValue(opt.value)}
            onMouseLeave={() => setHoveredValue(null)}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                style={{
                  background: isActive ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
