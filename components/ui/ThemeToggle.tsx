import React, { useRef } from 'react';
import { MainTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Film, MapPin, Popcorn, Camera, Map, Navigation, Star } from 'lucide-react';
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
            <div className="theme-toggle__icon-group">
              <Film className="theme-toggle__main-icon" />
              <div className="theme-toggle__sub-icons">
                <Camera className="theme-toggle__sub-icon" />
                <Popcorn className="theme-toggle__sub-icon" />
              </div>
            </div>
          </div>

          {/* Places Mode Elements */}
          <div className="theme-toggle__places">
            <div className="theme-toggle__icon-group">
              <MapPin className="theme-toggle__main-icon" />
              <div className="theme-toggle__sub-icons">
                <Map className="theme-toggle__sub-icon" />
                <Navigation className="theme-toggle__sub-icon" />
                <Star className="theme-toggle__sub-icon" />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="theme-toggle__labels">
            <div className="theme-toggle__label movies-label">
              <Film className="theme-toggle__label-icon" />
              <span>Movies</span>
            </div>
            <div className="theme-toggle__label places-label">
              <MapPin className="theme-toggle__label-icon" />
              <span>Places</span>
            </div>
          </div>
        </div>
      </label>
    </div>
  );
};

export default ThemeToggle;
