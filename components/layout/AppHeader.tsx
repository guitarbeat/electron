import React from 'react';
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

  const modeLabel = activeTab === 'places' ? 'Places mode' : 'Movie mode';
  const modeIcon = activeTab === 'places' ? '📍' : '🎬';

  return (
    <header className="app-header">
      <div className={`app-header-shell${isMobile ? ' is-mobile' : ''}`}>
        <div className="app-header-inner">
          <div className="app-header-brand">
            <h1 className="app-header-title">Aaron &amp; Electra</h1>
            <div className="app-header-subtitle-row">
              <p className="app-header-subtitle">Movies &amp; Places</p>
              <span
                className={`app-header-mode-badge${activeTab === 'places' ? ' is-places' : ' is-movies'}`}
              >
                <span aria-hidden>{modeIcon}</span>
                {modeLabel}
              </span>
            </div>
          </div>

          <button
            ref={triggerRef}
            type="button"
            className={`profile-chip${isMobile ? ' profile-chip-mobile' : ''}`}
            onClick={toggleProfilePanel}
            aria-label="Open profile selector"
            aria-expanded={isProfileOpen}
            title="Open profile selector"
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
        <div ref={panelRef} className={`profile-panel${isMobile ? ' is-mobile' : ''}`}>
          <div className={`profile-panel__inner${isMobile ? ' is-mobile' : ''}`}>
            <UserSelection onUserSelected={handleUserSelected} />
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
