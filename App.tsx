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
import DebugMovies from './components/debug/DebugMovies';
import AppHeader from './components/layout/AppHeader';
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
    subtitle: string;
    description: string;
  }
> = {
  queue: {
    title: 'Movie Planner',
    subtitle: 'Curate what to watch next',
    description:
      'Track picks, manage shared memories, and keep suggestions moving without bouncing between screens.',
  },
  places: {
    title: 'Places Planner',
    subtitle: 'Capture date ideas and destinations',
    description:
      'Review saved spots, prioritize options, and keep the next plan visible in one focused workspace.',
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
  const panelTitle = activeTabMeta?.label || 'Movies';
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
          <section className="panel-intro animate-fade-in" aria-live="polite">
            <p className="panel-intro__eyebrow">{activeTabMeta?.icon} Current workspace</p>
            <div className="panel-intro__title-row">
              <h2 id="active-panel-title" className="panel-intro__title">
                {panelCopy.title}
              </h2>
              <span className="panel-intro__badge">
                {currentUser ? `${currentUser} profile` : 'Guest'}
              </span>
            </div>
            <p className="panel-intro__subtitle">{panelCopy.subtitle}</p>
            <p className="panel-intro__description">{panelCopy.description}</p>
            <p className="sr-only">{panelTitle}</p>
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
        <DebugMovies />
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
