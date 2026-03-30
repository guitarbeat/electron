import React, { type FC } from 'react';
import type { MainTab } from '@/shared/types';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));
import Watchlist from '@/components/watchlist';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({ isMobile, activeTab }) => {
  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
    >
      <section
        className={`workspace-surface workspace-surface--${activeTab}`}
        aria-labelledby={activeTab === 'queue' ? 'movies-section-title' : 'places-section-title'}
        style={{ minWidth: 0 }}
      >
        {activeTab === 'queue' ? (
          <>
            <h1 id="movies-section-title" className="sr-only">Movies</h1>
            <Watchlist isMobile={isMobile} />
          </>
        ) : (
          <>
            <h1 id="places-section-title" className="sr-only">Places</h1>
            <React.Suspense fallback={null}>
              <PlacesList />
            </React.Suspense>
          </>
        )}
      </section>
    </main>
  );
};

export default AppWorkspaceShell;
