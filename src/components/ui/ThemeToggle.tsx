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
      className={`theme-toggle theme-toggle--rocker${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
      data-active={activeTab}
      style={style}
    >
      <span className="rocker__shadow" aria-hidden="true" />
      <span className="rocker__shadow" aria-hidden="true" />
      <span className="rocker__inner" aria-hidden="true">
        <span className="rocker__options">
          <span className="rocker__option">🎬 Movies</span>
          <span className="rocker__sep" />
          <span className="rocker__option">📍 Places</span>
        </span>
      </span>
      <button
        type="button"
        className="rocker__hit rocker__hit--left"
        onClick={() => onChange('queue')}
        aria-pressed={activeTab === 'queue'}
        aria-label="Movies"
      />
      <button
        type="button"
        className="rocker__hit rocker__hit--right"
        onClick={() => onChange('places')}
        aria-pressed={activeTab === 'places'}
        aria-label="Places"
      />
    </div>
  );
};

export default ThemeToggle;
