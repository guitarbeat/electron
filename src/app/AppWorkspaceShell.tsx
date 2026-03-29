import React, { type FC, type RefObject } from 'react';
import type { MainTab } from '@/shared/types';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));
import Watchlist from '@/components/watchlist';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  workspaceControlsRef: RefObject<HTMLDivElement | null>;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
  workspaceControlsRef,
}) => {
  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
    >
      {!isMobile ? (
        // Desktop: keep an invisible dock target so the action bubble can position itself.
        <div
          ref={workspaceControlsRef}
          aria-hidden="true"
          className="workspace-header__controls workspace-header__controls--toggle"
          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        />
      ) : (
        // Mobile: no meaningful dock target (preserves existing behavior for pointer/tap docking).
        <div
          ref={workspaceControlsRef}
          aria-hidden="true"
          className="workspace-header__controls workspace-header__controls--toggle"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        />
      )}

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
