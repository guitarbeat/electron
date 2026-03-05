import React from 'react';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import type { MainTab } from '../../types';
import UserSelection from '../common/UserSelection';
import TabBar from '../ui/TabBar';

interface AppHeaderProps {
  tabs: { id: MainTab; label: string; icon?: string }[];
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ tabs, activeTab, onTabChange }) => {
  const isMobile = useMediaQuery(breakpoints.sm);

  return (
    <header className="app-header">
      <div className={`app-header-shell${isMobile ? ' is-mobile' : ''}`}>
        <div className="app-header-inner">
          <div className="app-header-brand">
            <h1 className="app-header-title">Date Night Orbit</h1>
            <p className="app-header-subtitle">our little corner of the universe</p>
          </div>
          <div className="app-header-profile">
            <UserSelection variant="inline" />
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
