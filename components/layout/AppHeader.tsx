import React from 'react';
import { colors, typography, layout, shadows, radius, spacing } from '../../design-system/tokens';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import type { MainTab, User } from '../../types';
import UserSelection from '../common/UserSelection';
import TabBar from '../ui/TabBar';

interface AppHeaderProps {
  tabs: { id: MainTab; label: string; icon?: string }[];
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  showWatchlistControlsSlot: boolean;
  currentUser: User | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  tabs,
  activeTab,
  onTabChange,
  showWatchlistControlsSlot,
  currentUser,
}) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isProfileOpen) return undefined;

    const onDocumentPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setIsProfileOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentPointer);
    document.addEventListener('touchstart', onDocumentPointer);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onDocumentPointer);
      document.removeEventListener('touchstart', onDocumentPointer);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isProfileOpen]);

  const toggleProfilePanel = () => {
    setIsProfileOpen((previous) => !previous);
  };

  const handleUserSelected = () => {
    setIsProfileOpen(false);
  };

  return (
    <header
      className="app-header"
      style={{
        minHeight: layout.topBarHeight,
        background: colors.surface1,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        boxShadow: shadows.card,
        position: 'relative',
        zIndex: 120,
      }}
    >
      <div
        className="app-header-shell"
        style={{
          maxWidth: layout.contentMaxWidth,
          margin: '0 auto',
          padding: isMobile ? `${spacing.xs} ${spacing.md} ${spacing.sm}` : `${spacing.xs} ${spacing.lg}`,
        }}
      >
        <div className="app-header-inner">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: isMobile ? typography.fontSize.sm : typography.fontSize.lg,
                lineHeight: 1.2,
                letterSpacing: typography.letterSpacing.normal,
                fontWeight: 600,
              }}
            >
              Aaron &amp; Electra
            </h1>
            <p
              style={{
                margin: 0,
                color: colors.textTertiary,
                fontSize: typography.fontSize.xs,
                marginTop: 2,
              }}
            >
              Movies & Places
            </p>
          </div>

          <button
            ref={triggerRef}
            type="button"
            className={isMobile ? 'profile-chip-mobile' : 'profile-chip'}
            onClick={toggleProfilePanel}
            aria-label="Open profile selector"
            aria-expanded={isProfileOpen}
            title="Open profile selector"
            style={{
              borderRadius: radius.full,
              border: `1px solid ${colors.border}`,
              background: colors.surface2,
              color: colors.textPrimary,
              padding: isMobile ? `${spacing.xs} ${spacing.sm}` : `${spacing.sm} ${spacing.md}`,
              fontSize: isMobile ? typography.fontSize.xs : typography.fontSize.sm,
              minHeight: 44,
              minWidth: isMobile ? 44 : undefined,
              touchAction: 'manipulation',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span aria-hidden style={{ fontSize: '16px' }}>
              {currentUser ? '👤' : '👥'}
            </span>
            <span style={{ display: isMobile && currentUser ? 'none' : 'inline' }}>
              {currentUser || 'Guest'}
            </span>
          </button>
        </div>

        <div className="app-header-nav-row">
          <TabBar tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
        </div>

        {showWatchlistControlsSlot && (
          <div
            id="watchlist-top-controls-slot"
            className="app-header-watchlist-slot"
            aria-live="polite"
          />
        )}
      </div>

      {isProfileOpen && (
        <div
          ref={panelRef}
          className="profile-panel"
          style={{
            position: 'absolute',
            top: '100%',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : spacing.lg,
            width: isMobile ? '100%' : 'min(560px, calc(100vw - 32px))',
            padding: isMobile ? `${spacing.sm} ${spacing.md}` : '0',
            zIndex: 101,
          }}
        >
          <div
            style={
              isMobile
                ? {
                    borderBottom: `1px solid ${colors.borderSubtle}`,
                    boxShadow: shadows.cardElevated,
                    borderRadius: radius.lg,
                  }
                : undefined
            }
          >
            <UserSelection onUserSelected={handleUserSelected} />
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
