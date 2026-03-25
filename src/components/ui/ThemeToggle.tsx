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

const TABS: { id: MainTab; icon: string; label: string }[] = [
  { id: 'queue', icon: '🎬', label: 'Movies' },
  { id: 'places', icon: '📍', label: 'Places' },
];

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
      role="tablist"
      aria-label={label ?? 'Switch between Movies and Places'}
      className={`theme-toggle theme-toggle--tabs${compact ? ' theme-toggle--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`theme-toggle__tab${activeTab === tab.id ? ' is-active' : ''}`}
        >
          <span className="theme-toggle__tab-icon" aria-hidden>{tab.icon}</span>
          <span className="theme-toggle__tab-label">{tab.label}</span>
          {activeTab === tab.id && (
            <span className="theme-toggle__tab-indicator" aria-hidden />
          )}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
