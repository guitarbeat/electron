import React from 'react';
import { MainTab, User } from '../../types';
import Button from '../ui/Button';
import { SettingsIcon } from '../icons';
import { colors, spacing, typography, layout } from '../../design-system/tokens';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';

interface MainTopBarProps {
  activeTab: MainTab;
  currentUser: User | null;
  onOpenProfile: () => void;
}

const TAB_LABELS: Record<MainTab, string> = {
  queue: 'Queue',
  messages: 'Messages',
  extras: 'Extras',
};

const MainTopBar: React.FC<MainTopBarProps> = ({ activeTab, currentUser, onOpenProfile }) => {
  const isMobile = useMediaQuery(breakpoints.sm);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 120,
        borderBottom: `1px solid ${colors.borderSecondary}35`,
        background:
          'radial-gradient(circle at 10% -20%, rgba(255, 105, 180, 0.2), rgba(255, 105, 180, 0)), linear-gradient(145deg, rgba(22, 33, 58, 0.94), rgba(14, 23, 43, 0.94))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          maxWidth: layout.contentMaxWidth,
          margin: '0 auto',
          minHeight: isMobile ? layout.topBarMobileHeight : layout.topBarHeight,
          paddingLeft: isMobile ? spacing.md : spacing.lg,
          paddingRight: isMobile ? spacing.md : spacing.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              color: colors.textPrimary,
              fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
              fontFamily: typography.fontFamily.heading.join(', '),
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Aaron & Electra&apos;s Movie List
          </h1>
          <p
            style={{
              margin: 0,
              marginTop: '2px',
              color: colors.textTertiary,
              fontSize: typography.fontSize.xs,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {TAB_LABELS[activeTab]}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenProfile}
          aria-label="Open profile and security controls"
          style={{
            flexShrink: 0,
            minHeight: '40px',
            padding: isMobile ? '6px 10px' : undefined,
            fontSize: typography.fontSize.xs,
            gap: spacing.xs,
          }}
        >
          <SettingsIcon style={{ width: '16px', height: '16px' }} />
          {currentUser ? currentUser : 'Guest'}
        </Button>
      </div>
    </header>
  );
};

export default MainTopBar;
