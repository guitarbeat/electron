import React, { type FC } from 'react';
import type { MainTab } from '@/shared/types';
import QuizAdBanner from '@/components/quiz/QuizAdBanner';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));
import WatchlistComponent from '@/components/watchlist/index';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  onOpenQuiz: () => void;
  quizCompleted: boolean;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({ isMobile, activeTab, onOpenQuiz, quizCompleted }) => {
  return (
    <main id="main-content" className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`} tabIndex={-1}>
      <section
        className={`workspace-surface workspace-surface--${activeTab}`}
        style={{ minWidth: 0 }}
      >
        {activeTab === 'queue' ? (
          <>
            <QuizAdBanner onOpen={onOpenQuiz} quizCompleted={quizCompleted} />
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
