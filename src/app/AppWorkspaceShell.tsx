import React, { type FC } from 'react';
import type { MainTab, User } from '@/shared/types';
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

interface GameShelfProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onOpenSpin: () => void;
  onOpenQuiz: () => void;
  onOpenQuizEditor: () => void;
}

const GameShelf: FC<GameShelfProps> = ({
  currentUser,
  quizCompleted,
  onOpenSpin,
  onOpenQuiz,
  onOpenQuizEditor,
}) => (
  <div className="game-shelf" role="group" aria-label="Games">
    <button
      type="button"
      className="game-shelf__btn game-shelf__btn--spin"
      onClick={onOpenSpin}
      aria-label="Open Spin & Match to pick tonight's movie"
    >
      <span className="game-shelf__icon" aria-hidden="true">🎡</span>
      <div className="game-shelf__text">
        <span className="game-shelf__name">Spin &amp; Match</span>
        <span className="game-shelf__desc">Pick tonight's movie</span>
      </div>
      <span className="game-shelf__play" aria-hidden="true">▶</span>
    </button>

    <button
      type="button"
      className="game-shelf__btn game-shelf__btn--quiz"
      onClick={onOpenQuiz}
      aria-label={quizCompleted ? 'Retake the personality quiz' : 'Take the personality quiz'}
    >
      <span className="game-shelf__icon" aria-hidden="true">🧠</span>
      <div className="game-shelf__text">
        <span className="game-shelf__name">Movie Quiz</span>
        <span className="game-shelf__desc">
          {quizCompleted ? 'Retake your personality test' : 'Find your movie type'}
        </span>
      </div>
      <span className="game-shelf__play" aria-hidden="true">▶</span>
    </button>

    {currentUser ? (
      <button
        type="button"
        className="game-shelf__btn game-shelf__btn--edit"
        onClick={onOpenQuizEditor}
        aria-label="Edit quiz questions"
        title="Edit the quiz"
      >
        <span className="game-shelf__icon" aria-hidden="true">✏️</span>
        <div className="game-shelf__text">
          <span className="game-shelf__name">Edit Quiz</span>
          <span className="game-shelf__desc">Customise questions</span>
        </div>
      </button>
    ) : null}
  </div>
);

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
            <GameShelf
              currentUser={currentUser}
              quizCompleted={quizCompleted}
              onOpenSpin={onOpenSpin}
              onOpenQuiz={onOpenQuiz}
              onOpenQuizEditor={onOpenQuizEditor}
            />

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
