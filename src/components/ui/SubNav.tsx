import React from 'react';
import { colors, radius, spacing, typography, motion } from '@/theme/tokens';
import { useAudio } from '@/hooks/useAudio';

interface SubNavTab {
  id: string;
  label: string;
  count?: number;
}

interface SubNavProps {
  tabs: SubNavTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  variant?: 'pills' | 'underlined';
  chips?: { id: string; label: string; count?: number }[];
  activeChipId?: string;
  onChipChange?: (id: string) => void;
  mode?: 'default' | 'segmented';
  className?: string;
}

const SubNav: React.FC<SubNavProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  variant = 'underlined',
  chips,
  activeChipId,
  onChipChange,
  mode = 'default',
  className = '',
}) => {
  const { playSwitch } = useAudio();

  const handleTabClick = (id: string) => {
    if (id !== activeTabId) {
      playSwitch();
      onTabChange(id);
    }
  };

  const handleChipClick = (id: string) => {
    if (id !== activeChipId) {
      playSwitch();
      onChipChange?.(id);
    }
  };

  if (mode === 'segmented') {
    return (
      <div className={`ui-subnav ui-subnav--segmented ${className}`}>
        <div className="ui-subnav-segmented">
          <div className="ui-subnav-segmented__tabs" role="tablist" aria-label="Watchlist tabs">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabClick(tab.id)}
                  className={`ui-subnav__tab${isActive ? ' is-active' : ''}`}
                >
                  {tab.label}
                  {tab.count !== undefined && <span className="ui-subnav__count">{tab.count}</span>}
                </button>
              );
            })}
          </div>

          {chips && chips.length > 0 && (
            <div className="ui-subnav-segmented__sort" role="group" aria-label="Sort watchlist">
              {chips.map((chip) => {
                const isActive = chip.id === activeChipId;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleChipClick(chip.id)}
                    className={`ui-subnav__chip${isActive ? ' is-active' : ''}`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ui-subnav ui-subnav--${variant} ui-subnav--default-layout ${className}`}
    >
      <div
        className="ui-subnav-tabs ui-subnav-tabs--default"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              className={`ui-subnav__tab${isActive ? ' is-active' : ''}`}
              style={{
                position: 'relative',
                gap: spacing.xs,
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor:
                  variant === 'pills' && isActive ? colors.accent : 'transparent',
                color: isActive ? colors.textPrimary : colors.textTertiary,
                border: 'none',
                borderRadius: variant === 'pills' ? radius.full : '0',
                ...typography.presets.tabLabel,
                cursor: 'pointer',
                transition: `all ${motion.duration.fast} ${motion.easing.ease}`,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="ui-subnav__count"
                  style={{
                    minWidth: '1.25rem',
                    height: '1.25rem',
                    padding: '0 0.35rem',
                    backgroundColor: isActive
                      ? variant === 'pills'
                        ? 'rgba(0,0,0,0.15)'
                        : `${colors.accent}25`
                      : 'rgba(255,255,255,0.08)',
                    borderRadius: radius.full,
                    fontSize: '0.65rem',
                    fontWeight: typography.fontWeight.bold,
                    color: isActive ? colors.accent : colors.textTertiary,
                    transition: 'inherit',
                  }}
                >
                  {tab.count}
                </span>
              )}
              {variant === 'underlined' && isActive && (
                <div
                  className="ui-subnav__indicator"
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: colors.accent,
                    boxShadow: `0 0 10px ${colors.accent}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {chips && chips.length > 0 && (
        <div
          className="ui-subnav-chips"
          style={{
            gap: spacing.xs,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: spacing.xs,
          }}
        >
          {chips.map((chip) => {
            const isActive = chip.id === activeChipId;
            return (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip.id)}
                className={`ui-subnav__chip${isActive ? ' is-active' : ''}`}
                style={{
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: isActive ? `${colors.accent}20` : 'rgba(255,255,255,0.04)',
                  color: isActive ? colors.accent : colors.textTertiary,
                  border: `1px solid ${isActive ? colors.accent : colors.borderSubtle}`,
                  borderRadius: radius.full,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: `all ${motion.duration.fast} ${motion.easing.ease}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {chip.label}
                {chip.count !== undefined && (
                  <span style={{ opacity: 0.6, fontSize: '0.9em' }}>({chip.count})</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubNav;
