import React, { useId } from 'react';
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
  const toggleId = useId();

  const isPlacesMode = activeTab === 'places';

  const handleToggle = () => {
    const newTab = isPlacesMode ? 'queue' : 'places';
    onChange(newTab);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    event.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    event.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  };

  const resetPointerGlow = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty('--mouse-x', '50%');
    event.currentTarget.style.setProperty('--mouse-y', '50%');
  };

  return (
    <button
      id={toggleId}
      type="button"
      role="switch"
      aria-checked={isPlacesMode}
      aria-label={label ?? `Switch to ${isPlacesMode ? 'Movies' : 'Places'} mode`}
      onClick={handleToggle}
      className={`theme-toggle theme-toggle__label theme-toggle--${isPlacesMode ? 'places' : 'movies'}${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointerGlow}
    >
      <div className="theme-toggle__track">
        <div className="theme-toggle__track-glow" aria-hidden="true" />
        <div className="theme-toggle__track-stars" aria-hidden="true" />
        <div className="theme-toggle__gel-halves" aria-hidden="true">
          <span className="theme-toggle__gel-half theme-toggle__gel-half--movies" />
          <span className="theme-toggle__gel-half theme-toggle__gel-half--places" />
        </div>
        <div className="theme-toggle__gel-sweep" aria-hidden="true" />
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

      {compact ? (
        <div className="theme-toggle__compact-legend" aria-hidden="true">
          <span
            className={
              !isPlacesMode
                ? 'theme-toggle__compact-legend-item is-active'
                : 'theme-toggle__compact-legend-item'
            }
          >
            Movies
          </span>
          <span
            className={
              isPlacesMode
                ? 'theme-toggle__compact-legend-item is-active'
                : 'theme-toggle__compact-legend-item'
            }
          >
            Places
          </span>
        </div>
      ) : null}
    </button>
  );
};

export default ThemeToggle;
