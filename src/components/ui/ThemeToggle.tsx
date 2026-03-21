import React, { useId } from 'react';
import type { MainTab } from '@/shared/types';

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
  label,
}) => {
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

  const handlePointerMove = (event: React.PointerEvent<HTMLLabelElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    event.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    event.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  };

  const resetPointerGlow = (event: React.PointerEvent<HTMLLabelElement>) => {
    event.currentTarget.style.setProperty('--mouse-x', '50%');
    event.currentTarget.style.setProperty('--mouse-y', '50%');
  };

  return (
    <div
      className={`theme-toggle theme-toggle--${isPlacesMode ? 'places' : 'movies'}${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
    >
      <label
        className="theme-toggle__label"
        htmlFor={toggleId}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointerGlow}
      >
        <input
          id={toggleId}
          type="checkbox"
          checked={isPlacesMode}
          onChange={handleToggle}
          onKeyDown={handleKeyDown}
          aria-label={label ?? `Switch to ${isPlacesMode ? 'Movies' : 'Places'} mode`}
        />
        <div className="theme-toggle__track">
          <div className="theme-toggle__track-glow" aria-hidden="true" />
          <div className="theme-toggle__track-stars" aria-hidden="true" />
          <div className="theme-toggle__thumb" aria-hidden="true">
            <div className="theme-toggle__thumb-aura" />
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
