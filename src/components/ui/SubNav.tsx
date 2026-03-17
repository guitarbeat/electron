import React from 'react';
import { colors, spacing, typography, radius } from '@/design-system';

interface SubNavTab {
  id: string;
  label: string;
  count?: number;
  icon?: string;
}

interface SubNavChip {
  id: string;
  label: string;
}

interface SubNavProps {
  /** Main tab row */
  tabs: SubNavTab[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Optional secondary row (e.g. "Sort by" chips) */
  chips?: SubNavChip[];
  activeChipId?: string;
  onChipSelect?: (id: string) => void;
  chipLabel?: string;
  /** Accessibility */
  ariaLabel?: string;
  /** Optional class for scroll container (e.g. hide scrollbar) */
  scrollClassName?: string;
}

const SubNav: React.FC<SubNavProps> = ({
  tabs,
  activeId,
  onSelect,
  chips,
  activeChipId,
  onChipSelect,
  chipLabel = 'Sort by',
  ariaLabel = 'Sub-navigation',
  scrollClassName,
}) => {
  return (
    <nav
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
    >
      {/* Main tabs: clearer hierarchy (icon + label) | count badge */}
      <div
        className={scrollClassName}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing.md,
          alignItems: 'stretch',
          minHeight: '44px',
          padding: spacing.xs,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              aria-pressed={isActive}
              aria-label={tab.count !== undefined ? `${tab.label}, ${tab.count} items` : tab.label}
              style={{
                flex: '0 1 auto',
                minHeight: '44px',
                paddingLeft: spacing.md,
                paddingRight: tab.count !== undefined ? spacing.sm : spacing.md,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                borderRadius: '2px',
                border: isActive
                  ? `2px solid ${colors.accent}`
                  : `2px solid rgba(255,255,255,0.18)`,
                background: isActive
                  ? `linear-gradient(180deg, ${colors.accentLight} 0%, ${colors.accent} 100%)`
                  : 'linear-gradient(180deg, rgba(80,40,80,0.7) 0%, rgba(40,20,50,0.9) 100%)',
                color: isActive ? '#1a1a2e' : colors.textSecondary,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.1s ease',
                ...typography.presets.tabLabel,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                boxShadow: isActive
                  ? 'inset 1px 1px 0 rgba(255,255,255,0.6), inset -1px -1px 0 rgba(0,0,0,0.4), 0 0 12px rgba(255,105,180,0.35)'
                  : 'inset 1px 1px 0 rgba(255,255,255,0.25), inset -1px -1px 0 rgba(0,0,0,0.5)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                {tab.icon && (
                  <span
                    style={{ fontSize: '1.1em', lineHeight: 1, opacity: isActive ? 1 : 0.9 }}
                    aria-hidden
                  >
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
              </span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: typography.presets.badge.fontSize,
                    fontWeight: typography.presets.badge.fontWeight,
                    background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)',
                    color: isActive ? '#1a1a2e' : colors.textPrimary,
                    padding: '2px 5px',
                    borderRadius: '1px',
                    minWidth: '20px',
                    textAlign: 'center',
                    lineHeight: typography.presets.badge.lineHeight,
                    border: '1px solid rgba(0,0,0,0.3)',
                    boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Optional chips row (e.g. Sort by) */}
      {chips && chips.length > 0 && onChipSelect && (
        <div
          role="group"
          aria-label={chipLabel}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing.sm,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: colors.textTertiary,
              ...typography.presets.eyebrow,
              marginRight: spacing.xs,
            }}
          >
            {chipLabel}
          </span>
          {chips.map((chip) => {
            const isActive = activeChipId === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChipSelect(chip.id)}
                aria-pressed={isActive}
                aria-label={`${chipLabel} ${chip.label}`}
                style={{
                  minHeight: '34px',
                  padding: `0 ${spacing.md}`,
                  borderRadius: '2px',
                  border: `2px solid ${isActive ? colors.secondary : 'rgba(255,255,255,0.15)'}`,
                  background: isActive
                    ? `linear-gradient(180deg, ${colors.secondaryHover} 0%, ${colors.secondary} 100%)`
                    : 'linear-gradient(180deg, rgba(60,40,80,0.7) 0%, rgba(30,20,45,0.9) 100%)',
                  color: isActive ? '#1a1a2e' : colors.textTertiary,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  fontFamily: typography.fontFamilyValue.body,
                  lineHeight: typography.lineHeight.snug,
                  boxShadow: isActive
                    ? 'inset 1px 1px 0 rgba(255,255,255,0.6), inset -1px -1px 0 rgba(0,0,0,0.4)'
                    : 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.5)',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default SubNav;
