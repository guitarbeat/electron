import React from 'react';
import { MainTab } from '../../types';
import { colors, layout, motion, radius, shadows, spacing, typography } from '../../design-system/tokens';
import { DiceIcon, FilmIcon, MessageIcon } from '../icons';

type NavItem = {
  id: MainTab;
  label: string;
  icon: React.ReactNode;
  hint: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'queue', label: 'Queue', icon: <FilmIcon style={{ width: 18, height: 18 }} />, hint: 'Your movie list' },
  { id: 'spin', label: 'Spin', icon: <DiceIcon style={{ width: 18, height: 18 }} />, hint: 'Pick a random movie' },
  { id: 'games', label: 'Games', icon: <span style={{ fontSize: 18, lineHeight: 1 }}>🎮</span>, hint: 'Mini games' },
  { id: 'quiz', label: 'Quiz', icon: <span style={{ fontSize: 18, lineHeight: 1 }}>❓</span>, hint: 'Personality quiz' },
  { id: 'messages', label: 'Chat', icon: <MessageIcon style={{ width: 18, height: 18 }} />, hint: 'Message board' },
];

export default function MainNavigation({
  activeTab,
  onChange,
  isMobile,
}: {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
  isMobile: boolean;
}) {
  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        padding: `0 ${spacing.md} calc(env(safe-area-inset-bottom, 0px) + ${spacing.sm})`,
        pointerEvents: 'none',
      }
    : {
        position: 'sticky',
        top: spacing.md,
        zIndex: 50,
        marginBottom: spacing.lg,
      };

  const barStyle: React.CSSProperties = isMobile
    ? {
        height: layout.tabBarHeight,
        width: '100%',
        pointerEvents: 'auto',
      }
    : {
        height: layout.desktopNavHeight,
        width: '100%',
      };

  return (
    <nav aria-label="Main navigation" style={containerStyle}>
      <div
        style={{
          ...barStyle,
          background: 'rgba(23, 33, 58, 0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${colors.borderSecondary}2d`,
          borderRadius: radius.full,
          boxShadow: '0 14px 34px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'stretch',
          gap: spacing.xs,
          padding: spacing.xs,
          overflow: 'hidden',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              title={item.hint}
              aria-current={isActive ? 'page' : undefined}
              style={{
                position: 'relative',
                flex: 1,
                border: 'none',
                borderRadius: radius.full,
                cursor: 'pointer',
                background: isActive
                  ? `linear-gradient(135deg, ${colors.accent}2b, ${colors.secondary}14)`
                  : 'transparent',
                color: isActive ? colors.textPrimary : colors.textSecondary,
                transition: `transform ${motion.duration.fast} ${motion.easing.easeOut}, background ${motion.duration.normal} ${motion.easing.easeOut}, color ${motion.duration.normal} ${motion.easing.easeOut}`,
                transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: isActive ? `0 0 0 1px ${colors.accent}33, 0 0 18px ${colors.accent}18` : 'none',
                padding: isMobile ? `${spacing.sm} ${spacing.xs}` : `${spacing.sm} ${spacing.md}`,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : spacing.sm,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: isMobile ? '12px' : typography.fontSize.sm,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: typography.letterSpacing.wide,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </span>
              <span style={{ lineHeight: 1 }}>{item.label}</span>

              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '14%',
                    right: '14%',
                    bottom: isMobile ? 8 : 6,
                    height: 2,
                    borderRadius: 999,
                    background: colors.gradientPink,
                    boxShadow: shadows.glow,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
