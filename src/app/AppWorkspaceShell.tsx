import React, { useState, type FC } from 'react';
import type { MainTab, Movie } from '@/shared/types';
import QuizAdBanner from '@/components/quiz/QuizAdBanner';
import SpinAdBanner from '@/components/spinMatch/SpinAdBanner';
import WatchlistComponent from '@/components/watchlist/index';
import PosterCarouselInline from '@/components/posterExplore/PosterCarouselInline';
import './AppWorkspaceShell.css';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));

export type ViewMode = 'grid' | 'carousel';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  onOpenQuiz: () => void;
  quizCompleted: boolean;
  onOpenSpin: () => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  movies: Movie[];
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
  onOpenQuiz,
  quizCompleted,
  onOpenSpin,
  viewMode,
  onSetViewMode,
  movies,
}) => {
  const [bannersOpen, setBannersOpen] = useState<boolean>(
    () => localStorage.getItem('bannersOpen') !== 'false'
  );

  const toggleBanners = () => {
    const next = !bannersOpen;
    setBannersOpen(next);
    localStorage.setItem('bannersOpen', String(next));
  };

  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
    >
      <section
        className={`workspace-surface workspace-surface--${activeTab}${viewMode === 'carousel' ? ' workspace-surface--carousel-mode' : ''}`}
        style={{ minWidth: 0 }}
      >
        {activeTab === 'queue' ? (
          <>
            <div className={`ad-banners-collapsible${bannersOpen ? '' : ' ad-banners-collapsible--closed'}`}>
              <div className="ad-banners-row">
                <div className="ad-banners-row__item">
                  <QuizAdBanner onOpen={onOpenQuiz} quizCompleted={quizCompleted} />
                </div>
                <div className="ad-banners-row__item">
                  <SpinAdBanner onOpen={onOpenSpin} />
                </div>
              </div>
            </div>

            <div className="view-toggle-bar">
              <button
                className={`view-toggle-btn${viewMode === 'grid' ? ' view-toggle-btn--active' : ''}`}
                onClick={() => onSetViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                title="Grid view"
              >
                <span className="view-toggle-btn__icon">▤</span>
                <span className="view-toggle-btn__label">List</span>
              </button>
              <button
                className={`view-toggle-btn${viewMode === 'carousel' ? ' view-toggle-btn--active' : ''}`}
                onClick={() => onSetViewMode('carousel')}
                aria-pressed={viewMode === 'carousel'}
                title="Poster view"
              >
                <span className="view-toggle-btn__icon">🎬</span>
                <span className="view-toggle-btn__label">Posters</span>
              </button>

              <button
                className="banners-toggle-btn"
                onClick={toggleBanners}
                aria-label={bannersOpen ? 'Hide banners' : 'Show banners'}
                title={bannersOpen ? 'Hide banners' : 'Show banners'}
              >
                <span className={`banners-toggle-btn__chevron${bannersOpen ? '' : ' banners-toggle-btn__chevron--up'}`}>
                  ›
                </span>
                <span className="banners-toggle-btn__label">
                  {bannersOpen ? 'Hide' : 'Games'}
                </span>
              </button>
            </div>

            {viewMode === 'carousel' ? (
              <PosterCarouselInline movies={movies} />
            ) : (
              <WatchlistComponent isMobile={isMobile} />
            )}
          </>
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
