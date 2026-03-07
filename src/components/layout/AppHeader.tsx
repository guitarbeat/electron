import React from 'react';
import { useMediaQuery, breakpoints } from '@/hooks/useMediaQuery';
import { useUser } from '@/context/UserContext';
import type { MainTab } from '@/types';
import UserSelection from '@/common/UserSelection';
import TabBar from '@/ui/TabBar';

interface AppHeaderProps {
  tabs: { id: MainTab; label: string; icon?: string }[];
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ tabs, activeTab, onTabChange }) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const { currentUser, setCurrentUser } = useUser();
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || 'Home';

  return (
    <header className="app-header">
      <div className={`app-header-shell${isMobile ? ' is-mobile' : ''}`}>
        <div className="app-header-inner">
          <div className="app-header-brand">
            <p className="app-header-kicker">
              {currentUser ? `Pilot: ${currentUser}` : 'Choose a pilot below'}
            </p>
            <h1 className="app-header-title">Aaron + Electra Console</h1>
            <p className="app-header-subtitle">{activeTabLabel}</p>
          </div>

          <div className="app-header-profile">
            <UserSelection
              variant="inline"
              currentUser={currentUser}
              onSelect={(user) => setCurrentUser(user)}
            />
          </div>
        </div>

        <div className="app-header-nav-row">
          <TabBar tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
