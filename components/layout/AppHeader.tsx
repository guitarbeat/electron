import React from 'react';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import type { MainTab, User } from '../../types';
import UserSelection from '../common/UserSelection';
import TabBar from '../ui/TabBar';

interface AppHeaderProps {
  tabs: { id: MainTab; label: string; icon?: string }[];
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  currentUser: User | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  tabs,
  activeTab,
  onTabChange,
  currentUser,
}) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isProfileOpen) {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      return undefined;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;
    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 0);

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

    const onTabTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!nodes.length) {
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('mousedown', onDocumentPointer);
    document.addEventListener('touchstart', onDocumentPointer);
    document.addEventListener('keydown', onEscape);
    document.addEventListener('keydown', onTabTrap);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', onDocumentPointer);
      document.removeEventListener('touchstart', onDocumentPointer);
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('keydown', onTabTrap);
    };
  }, [isProfileOpen]);

  const toggleProfilePanel = () => {
    setIsProfileOpen((previous) => !previous);
  };

  const handleUserSelected = () => {
    setIsProfileOpen(false);
  };

  const activeWorkspaceLabel = activeTab === 'places' ? 'Places' : 'Movies';

  return (
    <header className="app-header">
      <div className={`app-header-shell${isMobile ? ' is-mobile' : ''}`}>
        <div className="app-header-inner">
          <div className="app-header-brand">
            <h1 className="app-header-title">Aaron &amp; Electra</h1>
            <p className="app-header-subtitle">Workspace: {activeWorkspaceLabel}</p>
          </div>

          <button
            ref={triggerRef}
            type="button"
            className={`profile-chip${isMobile ? ' profile-chip-mobile' : ''}`}
            onClick={toggleProfilePanel}
            aria-label="Open profile selector"
            aria-expanded={isProfileOpen}
            aria-haspopup="dialog"
            aria-controls="profile-selector-panel"
            title="Open profile selector"
          >
            <span aria-hidden style={{ fontSize: '16px' }}>
              {currentUser ? '👤' : '👥'}
            </span>
            <span>{currentUser || 'Guest'}</span>
          </button>
        </div>

        <div className="app-header-nav-row">
          <TabBar tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
        </div>
      </div>

      {isProfileOpen && (
        <div
          ref={panelRef}
          className={`profile-panel${isMobile ? ' is-mobile' : ''}`}
          id="profile-selector-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Profile selector"
        >
          <div className={`profile-panel__inner${isMobile ? ' is-mobile' : ''}`}>
            <UserSelection onUserSelected={handleUserSelected} />
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
