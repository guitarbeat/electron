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
        onClick={() => onChange('queue')}
        className={`theme-toggle__segment${activeTab === 'queue' ? ' is-active' : ''}`}
      >
        <span className="theme-toggle__seg-icon" aria-hidden>🎬</span>
        <span className="theme-toggle__seg-label">Movies</span>
      </button>
      <button
        type="button"
        aria-pressed={activeTab === 'places'}
        onClick={() => onChange('places')}
        className={`theme-toggle__segment${activeTab === 'places' ? ' is-active' : ''}`}
      >
        <span className="theme-toggle__seg-icon" aria-hidden>📍</span>
        <span className="theme-toggle__seg-label">Places</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
