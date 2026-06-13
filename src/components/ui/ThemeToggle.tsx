import React, { useRef, useLayoutEffect, useState, useCallback } from 'react';
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

const TABS: { id: MainTab; icon: string; label: string }[] = [
  { id: 'movies', icon: '🎬', label: 'Movies' },
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
  const trackRef  = useRef<HTMLDivElement>(null);
  const btnRefs   = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({});
  const [ready, setReady] = useState(false);

  const movePill = useCallback(() => {
    const activeIdx = TABS.findIndex((t) => t.id === activeTab);
    const btn = btnRefs.current[activeIdx];
    const track = trackRef.current;
    if (!btn || !track) return;

    const trackRect = track.getBoundingClientRect();
    const btnRect   = btn.getBoundingClientRect();

    setPillStyle({
      left:   btnRect.left   - trackRect.left,
      top:    btnRect.top    - trackRect.top,
      width:  btnRect.width,
      height: btnRect.height,
    });
    setReady(true);
  }, [activeTab]);

  useLayoutEffect(() => {
    movePill();
  }, [movePill]);

  return (
    <div
      ref={trackRef}
      role="group"
      aria-label={label ?? 'Switch between Movies and Places'}
      className={`seg-control${compact ? ' seg-control--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {/* Sliding pill — positioned under the active button */}
      <span
        className={`seg-control__pill${ready ? ' seg-control__pill--ready' : ''}`}
        style={pillStyle}
        aria-hidden="true"
      />

      {TABS.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => { btnRefs.current[i] = el; }}
          type="button"
          className={`seg-control__btn${activeTab === tab.id ? ' seg-control__btn--active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-pressed={activeTab === tab.id}
        >
          <span className="seg-control__icon" aria-hidden="true">{tab.icon}</span>
          <span className="seg-control__label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
