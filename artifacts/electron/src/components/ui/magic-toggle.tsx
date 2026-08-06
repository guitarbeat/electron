import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import './magic-toggle.css';

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface MagicToggleProps<T extends string> {
  options: ToggleOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function MagicToggle<T extends string>({ options, activeValue, onChange, ariaLabel }: MagicToggleProps<T>) {
  return (
    <div
      className="magic-toggle"
      role="group"
      aria-label={ariaLabel || "Toggle options"}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`magic-toggle__btn ${activeValue === option.value ? 'is-active' : ''}`}
          aria-pressed={activeValue === option.value}
        >
          {activeValue === option.value && (
            <motion.div
              layoutId="magic-toggle-pill"
              className="magic-toggle__pill"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="magic-toggle__label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
