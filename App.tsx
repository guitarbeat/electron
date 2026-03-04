import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from './hooks/useAudio';
import { useUser } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainTab } from './types';
import { useQuiz } from './hooks/useQuiz';
import Watchlist from './components/watchlist';
import MessageBoard from './components/common/MessageBoard';
import SnakeGame from './components/snake/SnakeGame';
import FoodDropGame from './components/food-drop/FoodDropGame';
import SpinWheel from './components/extras/spin-wheel/SpinWheel';
import MatchmakerBubble from './components/matchmaker/MatchmakerBubble';
import QuizBubble from './components/quiz/QuizBubble';
import DragDismissZone from './components/common/DragDismissZone';
import RestoreBubblesButton from './components/common/RestoreBubblesButton';
import { BubbleDismissProvider, useBubbleDismiss } from './context/BubbleDismissContext';
import QuizEditor from './components/quiz/QuizEditor';
import PlacesList from './components/places/PlacesList';
import MinigameModal from './components/ui/MinigameModal';
import AppHeader from './components/layout/AppHeader';
import UserSelection from './components/common/UserSelection';
import './App.css';

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'queue', label: 'Movies', icon: '🎬' },
  { id: 'places', label: 'Places', icon: '📍' },
];

type WorkspaceTab = 'queue' | 'places';

const TAB_COPY: Record<
  WorkspaceTab,
  {
    title: string;
    helper: string;
  }
> = {
  queue: {
    title: 'Movie Planner',
    helper: 'Plan what to watch without leaving this screen.',
  },
  places: {
    title: 'Places Planner',
    helper: 'Capture and sort places for your next outing.',
  },
};

const AppInner: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const { quizData } = useQuiz(true);
  const { isDragging, isHoveringDismiss } = useBubbleDismiss();

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  useEffect(() => {
    const theme = activeTab === 'places' ? 'places' : 'movies';
    document.body.setAttribute('data-theme', theme);
  }, [activeTab]);

  const handleTabChange = (tab: MainTab) => {
    if (tab !== activeTab) {
      playSwitch();
    }
    setActiveTab(tab);
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
  };

  const handleOpenQuizEditor = () => {
    setShowQuizEditor(true);
  };

  const activeTabMeta = useMemo(() => MAIN_TABS.find((item) => item.id === activeTab), [activeTab]);
  const panelCopy = TAB_COPY[activeTab as WorkspaceTab];

  return (
    <ThemeProvider activeTab={activeTab}>
      <div className="app-shell bg-main">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <AppHeader
          tabs={MAIN_TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showWatchlistControlsSlot={activeTab === 'queue'}
          currentUser={currentUser}
        />

        <main
          id="main-content"
          className="main-container"
          tabIndex={-1}
          aria-labelledby="active-panel-title"
        >
          <section className="panel-summary animate-fade-in" aria-live="polite">
            <div className="panel-summary__title-row">
              <h2 id="active-panel-title" className="panel-summary__title">
                {panelCopy.title}
              </h2>
              <span className="panel-summary__meta">
                {activeTabMeta?.icon} {currentUser ? currentUser : 'Guest'}
              </span>
            </div>
            <p className="panel-summary__hint">{panelCopy.helper}</p>
          </section>

          <section
            className="homepage-user-selection animate-fade-in"
            aria-label="Profile selector"
          >
            <UserSelection />
          </section>

          {MAIN_TABS.map((tab) => {
            const isActivePanel = tab.id === activeTab;
            return (
              <section
                key={tab.id}
                id={`tabpanel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                hidden={!isActivePanel}
                className={`tab-panel${isActivePanel ? ' animate-fade-in' : ''}`}
              >
                {isActivePanel ? (
                  tab.id === 'queue' ? (
                    <Watchlist topControlsMountId="watchlist-top-controls-slot" />
                  ) : (
                    <PlacesList />
                  )
                ) : null}
              </section>
            );
          })}
        </main>

        <MinigameModal
          isOpen={showQuizEditor}
          onClose={() => setShowQuizEditor(false)}
          title="Quiz Editor"
          ariaLabel="Quiz editor"
          maxWidth={1200}
          maxHeight={900}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <QuizEditor onClose={() => setShowQuizEditor(false)} />
          </div>
        </MinigameModal>

        <MessageBoard mode="floating" />
        <SpinWheel mode="floating" />
        <SnakeGame mode="floating" />
        <FoodDropGame mode="floating" />
        <QuizBubble
          quizData={quizData}
          quizCompleted={quizCompleted}
          currentUser={currentUser}
          onQuizComplete={handleQuizComplete}
          onOpenQuizEditor={handleOpenQuizEditor}
        />
        <MatchmakerBubble currentUser={currentUser} />
        <DragDismissZone visible={isDragging} isHovering={isHoveringDismiss} />
        <RestoreBubblesButton />
      </div>
    </ThemeProvider>
  );
};

const App: React.FC = () => (
  <BubbleDismissProvider>
    <AppInner />
  </BubbleDismissProvider>
);

export default App;
