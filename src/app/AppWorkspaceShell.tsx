import React, { type FC } from 'react';
import type { MainTab } from '@/shared/types';
import QuizAdBanner from '@/components/quiz/QuizAdBanner';
import SpinAdBanner from '@/components/spinMatch/SpinAdBanner';
import WatchlistComponent from '@/components/watchlist/index';
import './ShellControlStrip.css';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));

const TICKER_TEXT =
  '\u00a0\u00a0★ AARON & ELECTRA\'S MOVIE NIGHT · 🎬 NO SPOILERS ALLOWED · 🍿 POPCORN MANDATORY · 2 HEARTS · 1 SCREEN · ★ MADE WITH LOVE · SPIN THE WHEEL · PICK TOGETHER · \u00a0\u00a0★ AARON & ELECTRA\'S MOVIE NIGHT · 🎬 NO SPOILERS ALLOWED · 🍿 POPCORN MANDATORY · 2 HEARTS · 1 SCREEN · ★ MADE WITH LOVE · SPIN THE WHEEL · PICK TOGETHER ·';

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
      <div className="y2k-ticker" aria-hidden="true">
        <div className="y2k-ticker__inner">
          <span className="y2k-ticker__text">{TICKER_TEXT}</span>
        </div>
      </div>
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
