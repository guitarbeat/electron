import React, { type FC } from 'react';
import type { MainTab, User } from '@/shared/types';
import QuizAdBanner from '@/components/quiz/QuizAdBanner';
import SpinAdBanner from '@/components/spinMatch/SpinAdBanner';
import WatchlistComponent from '../components/watchlist/index.tsx';
import './AppWorkspaceShell.css';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  currentUser: User | null;
  onOpenQuiz: () => void;
  onOpenQuizEditor: () => void;
  quizCompleted: boolean;
  onOpenSpin: () => void;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
  currentUser,
  onOpenQuiz,
  onOpenQuizEditor,
  quizCompleted,
  onOpenSpin,
}) => {
  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
    >
      <section
        className={`workspace-surface workspace-surface--${activeTab}`}
        style={{ minWidth: 0 }}
      >
        {activeTab === 'queue' ? (
          <>
            <div className="ad-banners-row">
              <div className="ad-banners-row__item">
                <QuizAdBanner
                  currentUser={currentUser}
                  onOpen={onOpenQuiz}
                  onEdit={onOpenQuizEditor}
                  quizCompleted={quizCompleted}
                />
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
