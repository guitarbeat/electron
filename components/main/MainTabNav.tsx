import React from 'react';
import { MainTab } from '../../types';
import {
  FilmIcon,
  SparkleHeartIcon,
  MessageIcon,
  TicketIcon,
} from '../icons';
import { colors, spacing, typography, radius, layout } from '../../design-system/tokens';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';

interface MainTabNavProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

interface TabConfig {
  id: MainTab;
  label: string;
  icon: React.ReactNode;
}

const TAB_CONFIG: TabConfig[] = [
  { id: 'queue', label: 'Queue', icon: <FilmIcon style={{ width: '18px', height: '18px' }} /> },
  {
    id: 'memories',
    label: 'Memories',
    icon: <SparkleHeartIcon style={{ width: '18px', height: '18px' }} />,
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <MessageIcon style={{ width: '18px', height: '18px' }} />,
  },
  {
    id: 'extras',
    label: 'Extras',
    icon: <TicketIcon style={{ width: '18px', height: '18px' }} />,
  },
];

const MainTabNav: React.FC<MainTabNavProps> = ({ activeTab, onTabChange }) => {
  const isMobile = useMediaQuery(breakpoints.sm);

  if (isMobile) {
    return (
      <nav
        aria-label="Main sections"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 140,
          background:
            'linear-gradient(180deg, rgba(18, 26, 48, 0.98) 0%, rgba(13, 20, 37, 0.98) 100%)',
          borderTop: `1px solid ${colors.borderSecondary}40`,
          minHeight: `calc(${layout.tabBarHeight} + env(safe-area-inset-bottom, 0px))`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            minHeight: layout.tabBarHeight,
          }}
        >
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  border: 'none',
                  background: isActive
                    ? 'radial-gradient(circle at 50% 0%, rgba(255, 105, 180, 0.28), rgba(255, 105, 180, 0))'
                    : 'transparent',
                  color: isActive ? colors.textPrimary : colors.textTertiary,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                  letterSpacing: '0.03em',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main sections"
      style={{
        maxWidth: layout.contentMaxWidth,
        margin: `${spacing.md} auto ${spacing.lg}`,
        paddingLeft: spacing.lg,
        paddingRight: spacing.lg,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(25, 37, 66, 0.92), rgba(17, 28, 52, 0.92))',
          border: `1px solid ${colors.borderSecondary}40`,
          borderRadius: radius.full,
          padding: '6px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: spacing.xs,
          minHeight: layout.desktopNavHeight,
        }}
      >
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                border: 'none',
                borderRadius: radius.full,
                background: isActive
                  ? 'linear-gradient(145deg, rgba(255, 105, 180, 0.9), rgba(135, 206, 250, 0.9))'
                  : 'transparent',
                color: isActive ? '#080b13' : colors.textSecondary,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.heading.join(', '),
                letterSpacing: '0.03em',
                fontWeight: typography.fontWeight.semibold,
                padding: `0 ${spacing.md}`,
                transition: 'all 180ms ease-out',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MainTabNav;
