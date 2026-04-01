import React, { type FC } from 'react';
import type { MainTab } from '@/shared/types';
import QuizAdBanner from '@/components/quiz/QuizAdBanner';
import SpinAdBanner from '@/components/spinMatch/SpinAdBanner';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));
import WatchlistComponent from '@/components/watchlist/index';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  onOpenQuiz: () => void;
  quizCompleted: boolean;
  onOpenSpin: () => void;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({ isMobile, activeTab, onOpenQuiz, quizCompleted, onOpenSpin }) => {
  return (
    <main id="main-content" className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`} tabIndex={-1}>
      <section
        className={`workspace-surface workspace-surface--${activeTab}`}
        style={{ minWidth: 0 }}
      >
        {activeTab === 'queue' ? (
          <>
            <div className="ad-banners-row">
              <div className="ad-banners-row__item">
                <QuizAdBanner onOpen={onOpenQuiz} quizCompleted={quizCompleted} />
              </div>
              <div className="ad-banners-row__item">
                <SpinAdBanner onOpen={onOpenSpin} />
              </div>
            </div>
            <WatchlistComponent isMobile={isMobile} />
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
