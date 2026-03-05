import React, { useRef } from 'react';
import { MainTab } from '@/types;
import { useTheme } from '@/context/ThemeContext;
import './ThemeToggle.css';

interface ThemeToggleProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
  isMobile?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ activeTab, onChange, isMobile = false }) => {
  const { themeTokens } = useTheme();
  const toggleRef = useRef<HTMLInputElement>(null);

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
    <div className={`theme-toggle ${isMobile ? 'theme-toggle--mobile' : ''}`}>
      <label className="theme-toggle__label" htmlFor="theme-toggle-switch">
        <input
          ref={toggleRef}
          id="theme-toggle-switch"
          type="checkbox"
          checked={isPlacesMode}
          onChange={handleToggle}
          onKeyDown={handleKeyDown}
          aria-label={`Switch to ${isPlacesMode ? 'Movies' : 'Places'} mode`}
        />
        <div className="theme-toggle__slider">
          {/* Movies Mode Elements */}
          <div className="theme-toggle__movies">
            <div className="theme-toggle__film-reel">
              <div className="theme-toggle__film-reel-center" />
              <div className="theme-toggle__film-reel-spokes" />
            </div>
            <div className="theme-toggle__film-strip">
              <div className="theme-toggle__film-frame" />
              <div className="theme-toggle__film-frame" />
              <div className="theme-toggle__film-frame" />
            </div>
            <div className="theme-toggle__popcorn">
              <div className="theme-toggle__popcorn-kernel" />
              <div className="theme-toggle__popcorn-kernel" />
              <div className="theme-toggle__popcorn-kernel" />
            </div>
          </div>

          {/* Places Mode Elements */}
          <div className="theme-toggle__places">
            <div className="theme-toggle__map-pin">
              <div className="theme-toggle__pin-head" />
              <div className="theme-toggle__pin-point" />
            </div>
            <div className="theme-toggle__cloud cloud1">
              <div className="theme-toggle__cloud-part" />
              <div className="theme-toggle__cloud-part" />
            </div>
            <div className="theme-toggle__cloud cloud2">
              <div className="theme-toggle__cloud-part" />
              <div className="theme-toggle__cloud-part" />
            </div>
            <div className="theme-toggle__stars">
              <div className="theme-toggle__star star1" />
              <div className="theme-toggle__star star2" />
              <div className="theme-toggle__star star3" />
              <div className="theme-toggle__star star4" />
              <div className="theme-toggle__star star5" />
            </div>
          </div>

          {/* Labels */}
          <div className="theme-toggle__labels">
            <div className="theme-toggle__label movies-label">🎬 Movies</div>
            <div className="theme-toggle__label places-label">📍 Places</div>
          </div>
        </div>
      </label>
    </div>
  );
};

export default ThemeToggle;
