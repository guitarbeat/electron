import React from 'react';
import { colors, spacing, typography, radius } from '@/design-system/tokens';

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
                borderRadius: radius.lg,
                border: isActive
                  ? `2px solid ${colors.accent}`
                  : `1px solid ${colors.borderSecondary}30`,
                background: isActive
                  ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? '#1a1a2e' : colors.textSecondary,
                fontSize: 'clamp(0.72rem, 1vw + 0.45rem, 0.85rem)',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                fontFamily: typography.fontFamily.heading.join(', '),
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                boxShadow: isActive
                  ? '0 0 20px rgba(255,105,180,0.4)'
                  : '0 1px 3px rgba(0,0,0,0.15)',
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
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: isActive ? 'rgba(0,0,0,0.15)' : colors.overlay,
                    color: isActive ? '#1a1a2e' : colors.textPrimary,
                    padding: '3px 6px',
                    borderRadius: radius.full,
                    minWidth: '20px',
                    textAlign: 'center',
                    lineHeight: 1,
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
              fontSize: typography.fontSize.xs,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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
                  borderRadius: radius.md,
                  border: `1px solid ${isActive ? colors.secondary : `${colors.borderSecondary}40`}`,
                  background: isActive ? colors.secondaryMuted : 'rgba(255,255,255,0.04)',
                  color: isActive ? colors.secondary : colors.textTertiary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: typography.fontFamily.body.join(', '),
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
