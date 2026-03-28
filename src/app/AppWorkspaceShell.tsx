import React, { type FC, type RefObject } from 'react';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));
import Watchlist from '@/components/watchlist';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  workspaceControlsRef: RefObject<HTMLDivElement | null>;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem', minWidth: 0, width: '100%' }}>
        <section
          className="workspace-surface workspace-surface--queue"
          aria-labelledby="movies-section-title"
          style={{ minWidth: 0 }}
        >
          <h1 id="movies-section-title" className="sr-only">Movies</h1>
          <Watchlist
            isMobile={isMobile}
          />
        </section>

        <section
          className="workspace-surface workspace-surface--places"
          aria-labelledby="places-section-title"
          style={{ minWidth: 0 }}
        >
          <h2 id="places-section-title" className="sr-only">Places</h2>
          <React.Suspense fallback={null}>
            <PlacesList />
          </React.Suspense>
        </section>
      </div>
    </main>
  );
};

export default AppWorkspaceShell;
