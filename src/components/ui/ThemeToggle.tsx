import React from 'react';
import type { MainTab } from '@/shared/types';
import './ThemeToggle.css';

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
      className={`seg-control${compact ? ' seg-control--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <button
        type="button"
        className={`seg-control__btn${activeTab === 'queue' ? ' seg-control__btn--active' : ''}`}
        onClick={() => onChange('queue')}
        aria-pressed={activeTab === 'queue'}
      >
        <span className="seg-control__icon" aria-hidden="true">🎬</span>
        <span className="seg-control__label">Movies</span>
      </button>
      <button
        type="button"
        className={`seg-control__btn${activeTab === 'places' ? ' seg-control__btn--active' : ''}`}
        onClick={() => onChange('places')}
        aria-pressed={activeTab === 'places'}
      >
        <span className="seg-control__icon" aria-hidden="true">📍</span>
        <span className="seg-control__label">Places</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
