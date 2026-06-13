import React, { type FC, useState, useCallback } from 'react';

import type { MainTab } from '@/shared/types';
import MoviesView from '@/components/movies/MoviesView';
import BentoWorkspaceController from '@/components/ui/BentoWorkspaceController';
import { BentoSlotContext, type BentoSlotConfig } from './BentoSlotContext';

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
  const [bentoConfig, setBentoConfig] = useState<BentoSlotConfig | null>(null);
  const [searchPortalEl, setSearchPortalEl] = useState<HTMLDivElement | null>(null);

  const setConfig = useCallback((config: BentoSlotConfig) => {
    setBentoConfig(config);
  }, []);

  const searchSlotRef = useCallback((el: HTMLDivElement | null) => {
    setSearchPortalEl(el);
  }, []);

  return (
    <BentoSlotContext.Provider
      value={{ config: bentoConfig, setConfig, searchPortalEl, setSearchPortalEl }}
    >
      <main
        id="main-content"
        className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
        tabIndex={-1}
        style={{ position: 'relative' }}
      >
        <BentoWorkspaceController
          stats={bentoConfig?.stats ?? []}
          sorts={bentoConfig?.sorts ?? []}
          activeSortOrder={bentoConfig?.activeSortOrder ?? 'recent'}
          onSortChange={bentoConfig?.onSortChange ?? (() => {})}
          ariaLabel={bentoConfig?.ariaLabel}
        >
          <div ref={searchSlotRef} />
        </BentoWorkspaceController>

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
    </BentoSlotContext.Provider>
  );
};

export default AppWorkspaceShell;
