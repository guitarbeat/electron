import React, { type FC } from 'react';

import type { MainTab } from '@/shared/types';
import MoviesView from '@/components/movies/MoviesView';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));

const PlacesTabFallback: FC = () => (
  <div
    className="watchlist-container places-container"
    role="status"
    aria-label="Loading places"
    aria-live="polite"
  >
    <div
      style={{
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        opacity: 0.65,
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-interface)',
        fontSize: '0.9rem',
      }}
    >
      <span style={{ fontSize: '1.75rem', lineHeight: 1 }} aria-hidden="true">🗺️</span>
      <span>Loading places…</span>
    </div>
  </div>
);

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
}) => {
  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-4vh',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none',
          fontSize: 'clamp(5rem, 26vw, 22rem)',
          lineHeight: 0.75,
          fontWeight: 900,
          fontFamily: "Papyrus, 'Papyrus', serif",
          letterSpacing: '-0.05em',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.04)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 65%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }}
      >
        ELECTRON
      </div>

      <section
        className={`workspace-surface workspace-surface--${activeTab}`}
        style={{ position: 'relative', zIndex: 1, minWidth: 0 }}
        aria-label={activeTab === 'movies' ? 'Movies workspace' : 'Places workspace'}
      >
        {activeTab === 'movies' ? (
          <MoviesView isMobile={isMobile} />
        ) : (
          <React.Suspense fallback={<PlacesTabFallback />}>
            <PlacesList />
          </React.Suspense>
        )}
      </section>
    </main>
  );
};

export default AppWorkspaceShell;
