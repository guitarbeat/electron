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
      className={`theme-toggle theme-toggle--pill${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <button
        type="button"
        aria-pressed={activeTab === 'queue'}
        aria-label="Movies"
        onClick={() => onChange('queue')}
        className={`theme-toggle__segment${activeTab === 'queue' ? ' is-active' : ''}`}
      >
        <span className="theme-toggle__seg-icon" aria-hidden>🎬</span>
      </button>
      <button
        type="button"
        aria-pressed={activeTab === 'places'}
        aria-label="Places"
        onClick={() => onChange('places')}
        className={`theme-toggle__segment${activeTab === 'places' ? ' is-active' : ''}`}
      >
        <span className="theme-toggle__seg-icon" aria-hidden>📍</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
