import React from 'react';
import type { MainTab } from '@/shared/types';

interface ThemeToggleProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
  /** Slightly smaller hit target (e.g. floating chrome on mobile). */
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
  const isPlacesMode = activeTab === 'places';

  const handleClick = () => {
    onChange(isPlacesMode ? 'queue' : 'places');
  };

  const defaultLabel = isPlacesMode
    ? 'Date ideas (Places). Click to switch to Movies.'
    : 'Movies watchlist. Click to switch to Places.';

  return (
    <button
      type="button"
      aria-pressed={isPlacesMode}
      aria-label={label ?? defaultLabel}
      onClick={handleClick}
      className={`theme-toggle theme-toggle--icon-btn${isPlacesMode ? ' theme-toggle--places' : ' theme-toggle--movies'}${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <span className="theme-toggle__icon" aria-hidden>
        {isPlacesMode ? '📍' : '🎬'}
      </span>
    </button>
  );
};

export default ThemeToggle;
