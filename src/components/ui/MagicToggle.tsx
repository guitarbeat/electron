import React from 'react';
import { motion } from 'motion/react';
import './MagicToggle.css';

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

export function MagicToggle<T extends string>({
  options,
  activeValue,
  onChange,
  ariaLabel,
}: MagicToggleProps<T>) {
  return (
    <div className="magic-toggle" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = activeValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`magic-toggle__btn ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {isActive && (
              <motion.div
                layoutId="magic-toggle-bubble"
                className="magic-toggle__bubble"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="magic-toggle__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default MagicToggle;
