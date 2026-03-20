import React, { useId, useRef } from 'react';
import { MainTab } from '@/types';

interface ThemeToggleProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
  compact?: boolean;
  className?: string;
  label?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  activeTab,
  onChange,
  compact = false,
  className = '',
}) => {
  const toggleRef = useRef<HTMLInputElement>(null);
  const toggleId = useId();

  const isPlacesMode = activeTab === 'places';

  const handleToggle = () => {
    const newTab = isPlacesMode ? 'queue' : 'places';
    onChange(newTab);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={`theme-toggle${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
    >
      <label className="theme-toggle__label" htmlFor={toggleId}>
        <input
          ref={toggleRef}
          id={toggleId}
          type="checkbox"
          checked={isPlacesMode}
          onChange={handleToggle}
          onKeyDown={handleKeyDown}
          aria-label={`Switch to ${isPlacesMode ? 'Movies' : 'Places'} mode`}
        />
        <div className="theme-toggle__track">
          <div className="theme-toggle__thumb" aria-hidden="true">
            <div className="theme-toggle__thumb-shine" />
            <div className="theme-toggle__thumb-inner-glow" />
          </div>

          <div className="theme-toggle__option theme-toggle__option--movies" aria-hidden="true">
            <span className="theme-toggle__option-icon">🎬</span>
            <span className="theme-toggle__option-text">Movies</span>
          </div>

          <div className="theme-toggle__option theme-toggle__option--places" aria-hidden="true">
            <span className="theme-toggle__option-icon">📍</span>
            <span className="theme-toggle__option-text">Places</span>
          </div>

          <div className="theme-toggle__track-shimmer" aria-hidden="true" />
        </div>
      </label>
    </div>
  );
};

export default ThemeToggle;
