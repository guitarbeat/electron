import React from 'react';
import type { MainTab } from '@/shared/types';

interface ThemeToggleProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
  compact?: boolean;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  activeTab,
  onChange,
  compact = false,
  className = '',
  label,
  style,
}) => {
  return (
    <div
      role="group"
      aria-label={label ?? 'Switch between Movies and Places'}
      className={`theme-toggle theme-toggle--rocker${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
      data-active={activeTab}
      style={style}
    >
      <button
        type="button"
        className="rocker__side rocker__side--left"
        onClick={() => onChange('queue')}
        aria-pressed={activeTab === 'queue'}
        aria-label="Movies"
      >
        🎬
      </button>
      <button
        type="button"
        className="rocker__side rocker__side--right"
        onClick={() => onChange('places')}
        aria-pressed={activeTab === 'places'}
        aria-label="Places"
      >
        📍
      </button>
    </div>
  );
};

export default ThemeToggle;
