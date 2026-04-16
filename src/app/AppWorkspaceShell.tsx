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
  onOpenSpinOnly: () => void;
}

interface GameShelfProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onOpenSpin: () => void;
  onOpenSpinOnly: () => void;
  onOpenQuiz: () => void;
  onOpenQuizEditor: () => void;
}

const GameShelf: FC<GameShelfProps> = ({
  currentUser,
  quizCompleted,
  onOpenSpin,
  onOpenSpinOnly,
  onOpenQuiz,
  onOpenQuizEditor,
}) => (
  <div className="y2k-shelf" role="group" aria-label="Games">

    {/* ── Spin the Wheel ── */}
    <div className="y2k-banner y2k-banner--spin">
      <div className="y2k-banner__border">
        <button
          type="button"
          className="y2k-banner__inner"
          onClick={onOpenSpinOnly}
          aria-label="Open the spin wheel to pick a movie"
        >
          <div className="y2k-banner__marquee-wrap">
            <span className="y2k-banner__marquee y2k-banner__marquee--right">
              🎡 SPIN NOW &nbsp;·&nbsp; FEELING LUCKY? &nbsp;·&nbsp; LET THE WHEEL DECIDE &nbsp;·&nbsp;
              🎡 SPIN NOW &nbsp;·&nbsp; FEELING LUCKY? &nbsp;·&nbsp; LET THE WHEEL DECIDE &nbsp;·&nbsp;
            </span>
          </div>
          <div className="y2k-banner__body">
            <div className="y2k-banner__icon-wrap">
              <span className="y2k-banner__icon" aria-hidden="true">🎡</span>
            </div>
            <div className="y2k-banner__center">
              <p className="y2k-banner__label">Quick Pick</p>
              <p className="y2k-banner__headline">Spin the Wheel</p>
              <p className="y2k-banner__sub">Let fate choose tonight's movie!</p>
            </div>
            <div className="y2k-banner__cta" aria-hidden="true">
              <span className="y2k-banner__cta-text">SPIN!</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    {/* ── Spin & Match ── */}
    <div className="y2k-banner y2k-banner--match">
      <div className="y2k-banner__border">
        <button
          type="button"
          className="y2k-banner__inner"
          onClick={onOpenSpin}
          aria-label="Open Spin & Match to swipe movies then spin"
        >
          <div className="y2k-banner__marquee-wrap">
            <span className="y2k-banner__marquee y2k-banner__marquee--left">
              🃏 SWIPE TO BUILD YOUR LIST &nbsp;·&nbsp; THEN SPIN TO WIN &nbsp;·&nbsp; MATCH &amp; SPIN &nbsp;·&nbsp;
              🃏 SWIPE TO BUILD YOUR LIST &nbsp;·&nbsp; THEN SPIN TO WIN &nbsp;·&nbsp; MATCH &amp; SPIN &nbsp;·&nbsp;
            </span>
          </div>
          <div className="y2k-banner__body">
            <div className="y2k-banner__icon-wrap">
              <span className="y2k-banner__icon" aria-hidden="true">🃏</span>
            </div>
            <div className="y2k-banner__center">
              <p className="y2k-banner__label">Mini-Game</p>
              <p className="y2k-banner__headline">Spin &amp; Match</p>
              <p className="y2k-banner__sub">Swipe your picks, then spin!</p>
            </div>
            <div className="y2k-banner__cta" aria-hidden="true">
              <span className="y2k-banner__cta-text">PLAY!</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    {/* ── Movie Quiz ── */}
    <div className="y2k-banner y2k-banner--quiz">
      <div className="y2k-banner__border">
        <button
          type="button"
          className="y2k-banner__inner"
          onClick={onOpenQuiz}
          aria-label={quizCompleted ? 'Retake the personality quiz' : 'Take the personality quiz'}
        >
          <div className="y2k-banner__marquee-wrap">
            <span className="y2k-banner__marquee y2k-banner__marquee--right">
              🧠 WHAT IS YOUR MOVIE PERSONALITY? &nbsp;·&nbsp; TAKE THE QUIZ &nbsp;·&nbsp; FIND OUT NOW &nbsp;·&nbsp;
              🧠 WHAT IS YOUR MOVIE PERSONALITY? &nbsp;·&nbsp; TAKE THE QUIZ &nbsp;·&nbsp; FIND OUT NOW &nbsp;·&nbsp;
            </span>
          </div>
          <div className="y2k-banner__body">
            <div className="y2k-banner__icon-wrap">
              <span className="y2k-banner__icon" aria-hidden="true">🧠</span>
            </div>
            <div className="y2k-banner__center">
              <p className="y2k-banner__label">Personality Test</p>
              <p className="y2k-banner__headline">Movie Quiz</p>
              <p className="y2k-banner__sub">
                {quizCompleted ? 'Retake your personality test' : 'Find your movie type!'}
              </p>
            </div>
            <div className="y2k-banner__cta" aria-hidden="true">
              <span className="y2k-banner__cta-text">GO!</span>
            </div>
          </div>
        </button>
      </div>
    </div>


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
            <GameShelf
              currentUser={currentUser}
              quizCompleted={quizCompleted}
              onOpenSpin={onOpenSpin}
              onOpenSpinOnly={onOpenSpinOnly}
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
