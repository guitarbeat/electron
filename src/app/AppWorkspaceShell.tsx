import React, { type FC } from 'react';
import type { MainTab, User } from '@/shared/types';
import WatchlistComponent from '../components/watchlist/index.tsx';
import { GameDrawer } from '@/components/games/GameDrawer';
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
  onOpenSpinOnly: () => void;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
  onOpenQuiz,
  onOpenSpin,
  onOpenSpinOnly,
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
            <WatchlistComponent isMobile={isMobile} />

            <GameDrawer
              onSpinWheel={onOpenSpinOnly}
              onSpinMatch={onOpenSpin}
              onMovieQuiz={onOpenQuiz}
            />
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
