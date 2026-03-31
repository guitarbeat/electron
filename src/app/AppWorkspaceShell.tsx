import React, { type FC } from 'react';
import type { User } from '@/shared/types';
import type { MainTab } from '@/shared/types';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));
import WatchlistComponent from '@/components/watchlist/index';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  currentUser: User | null;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({ isMobile, activeTab, currentUser }) => {
  const profileLabel = currentUser ?? 'Guest mode';

  return (
    <main id="main-content" className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`} tabIndex={-1}>
      <header className={`workspace-hero workspace-hero--${activeTab}`}>
        <div className="workspace-hero__meta" aria-label="Workspace status">
          <span className="workspace-hero__status">{profileLabel}</span>
        </div>
      </header>

      <section
        className={`workspace-surface workspace-surface--${activeTab}`}
        style={{ minWidth: 0 }}
      >
        {activeTab === 'queue' ? (
          <WatchlistComponent isMobile={isMobile} />
        ) : (
          <React.Suspense fallback={null}>
            <PlacesList />
          </React.Suspense>
        )}
      </section>
    </main>
  );
};

export default AppWorkspaceShell;
