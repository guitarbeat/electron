import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from './hooks/useAudio';
import { useUser } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainTab } from './types';
import { useQuiz } from './hooks/useQuiz';
import { useMediaQuery, breakpoints } from './hooks/useMediaQuery';
import Watchlist from './components/watchlist';
import MessageBoard from './components/common/MessageBoard';
import SnakeGame from './components/snake/SnakeGame';
import SpinWheel from './components/extras/spin-wheel/SpinWheel';
import MatchmakerBubble from './components/matchmaker/MatchmakerBubble';
import QuizBubble from './components/quiz/QuizBubble';
import DragDismissZone from './components/common/DragDismissZone';
import RestoreBubblesButton from './components/common/RestoreBubblesButton';
import { BubbleDismissProvider, useBubbleDismiss } from './context/BubbleDismissContext';
import QuizEditor from './components/quiz/QuizEditor';
import PlacesList from './components/places/PlacesList';
import ThemeToggle from './components/ui/ThemeToggle';
import BottomSheet from './components/ui/BottomSheet';
import MinigameModal from './components/ui/MinigameModal';
import UserSelection from './components/common/UserSelection';
import DebugMovies from './components/debug/DebugMovies';
import AppHeader from './components/layout/AppHeader';
import { spacing, colors, typography, layout } from './design-system/tokens';
import './App.css';
import './components/ui/ProfileBubbles.css';

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'queue', label: 'Movies', icon: '🎬' },
  { id: 'places', label: 'Places', icon: '📍' },
];

const AppInner: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const isMobile = useMediaQuery(breakpoints.sm);
  const { quizData } = useQuiz(true);
  const { isDragging, isHoveringDismiss } = useBubbleDismiss();

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [showProfileSheet, setShowProfileSheet] = useState(false);
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

  const panelTitle = useMemo(() => {
    const tab = MAIN_TABS.find((item) => item.id === activeTab);
    return tab?.label || 'Movies';
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'queue':
        return <Watchlist topControlsMountId="watchlist-top-controls-slot" />;
      case 'places':
        return <PlacesList />;
      default:
        return <Watchlist topControlsMountId="watchlist-top-controls-slot" />;
    }
  };

  return (
    <ThemeProvider activeTab={activeTab}>
      <div
        className="app-shell bg-main"
        style={{
          color: colors.textPrimary,
          minHeight: '100vh',
          fontFamily: typography.fontFamily.body.join(', '),
        }}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <AppHeader onProfileClick={() => setShowProfileSheet(true)} currentUser={currentUser} />

        <div className="app-top-dock">
          <div className="app-top-dock__inner">
            <ThemeToggle activeTab={activeTab} onChange={handleTabChange} />
            {activeTab === 'queue' && (
              <div
                id="watchlist-top-controls-slot"
                className="app-top-dock__watchlist-slot"
                aria-live="polite"
              />
            )}
          </div>
        </div>

        <main
          id="main-content"
          className="main-container"
          tabIndex={-1}
          aria-labelledby="active-panel-title"
          style={{
            maxWidth: layout.contentMaxWidth,
            margin: '0 auto',
            paddingTop: spacing.lg,
            paddingBottom: isMobile
              ? `calc(${layout.tabBarHeight} + ${spacing.xl} + env(safe-area-inset-bottom, 0px))`
              : spacing.xl,
            paddingLeft: spacing.md,
            paddingRight: spacing.md,
            outline: 'none',
          }}
        >
          <h2 id="active-panel-title" className="sr-only">
            {panelTitle}
          </h2>

          {MAIN_TABS.map((tab) => {
            const isActivePanel = tab.id === activeTab;
            return (
              <section
                key={tab.id}
                id={`tabpanel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                hidden={!isActivePanel}
                className={isActivePanel ? 'animate-fade-in' : undefined}
              >
                {isActivePanel ? renderContent() : null}
              </section>
            );
          })}
        </main>

        <BottomSheet
          isOpen={showProfileSheet}
          onClose={() => setShowProfileSheet(false)}
          title="Who is watching?"
        >
          <p
            style={{
              margin: 0,
              marginBottom: spacing.md,
              textAlign: 'center',
              color: colors.textSecondary,
              fontSize: typography.fontSize.sm,
            }}
          >
            {currentUser
              ? 'Switch profiles any time for personalized updates and saved actions.'
              : 'You are in guest mode. Pick Aaron or Electra to save personalized updates and actions.'}
          </p>
          <UserSelection
            onUserSelected={() => setShowProfileSheet(false)}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </BottomSheet>

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
