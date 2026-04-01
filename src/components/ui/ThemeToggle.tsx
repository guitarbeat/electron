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
      className={`theme-toggle theme-toggle--tabs${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <button
        type="button"
        className={`win98-tab${activeTab === 'queue' ? ' win98-tab--active' : ''}`}
        onClick={() => onChange('queue')}
        aria-pressed={activeTab === 'queue'}
        aria-label="Movies"
      >
        🎬 Movies
      </button>
      <button
        type="button"
        className={`win98-tab${activeTab === 'places' ? ' win98-tab--active' : ''}`}
        onClick={() => onChange('places')}
        aria-pressed={activeTab === 'places'}
        aria-label="Places"
      >
        📍 Places
      </button>
    </div>
  );
};

export default ThemeToggle;
