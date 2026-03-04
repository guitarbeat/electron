import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from './hooks/useAudio';
import { useUser } from './context/UserContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
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
import { spacing, colors, typography, layout, shadows, radius } from './design-system/tokens';
import './App.css';
import './components/ui/ProfileBubbles.css';

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'queue', label: 'Movies', icon: '🎬' },
  { id: 'places', label: 'Places', icon: '📍' },
];
const PROFILE_PROMPT_SEEN_KEY = 'profilePromptSeen';

const AppInner: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const isMobile = useMediaQuery(breakpoints.sm);
  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const { quizData } = useQuiz(true);
  const { isDragging, isHoveringDismiss } = useBubbleDismiss();
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  return (
    <ThemeProvider activeTab={activeTab}>
      <BubbleDismissProvider>
        <AppInnerWithTheme 
          currentUser={currentUser}
          playSwitch={playSwitch}
          isMobile={isMobile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          quizData={quizData}
          isDragging={isDragging}
          isHoveringDismiss={isHoveringDismiss}
          showProfileSheet={showProfileSheet}
          setShowProfileSheet={setShowProfileSheet}
          quizCompleted={quizCompleted}
          setQuizCompleted={setQuizCompleted}
          showQuizEditor={showQuizEditor}
          setShowQuizEditor={setShowQuizEditor}
        />
      </BubbleDismissProvider>
    </ThemeProvider>
  );
};

const AppInnerWithTheme: React.FC<any> = ({
  currentUser,
  playSwitch,
  isMobile,
  activeTab,
  setActiveTab,
  quizData,
  isDragging,
  isHoveringDismiss,
  showProfileSheet,
  setShowProfileSheet,
  quizCompleted,
  setQuizCompleted,
  showQuizEditor,
  setShowQuizEditor,
}) => {
  const { themeTokens } = useTheme();

  // Update body data-theme attribute when active tab changes
  useEffect(() => {
    const theme = activeTab === 'places' ? 'places' : 'movies';
    document.body.setAttribute('data-theme', theme);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSeenPrompt = sessionStorage.getItem(PROFILE_PROMPT_SEEN_KEY) === 'true';
    if (!currentUser && !hasSeenPrompt) {
      setShowProfileSheet(true);
      sessionStorage.setItem(PROFILE_PROMPT_SEEN_KEY, 'true');
    }
  }, [currentUser]);

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
        return <Watchlist />;
      case 'places':
        return <PlacesList />;
      default:
        return <Watchlist />;
    }
  };

  return (
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

      {isMobile && (
        <div className="app-top-tabs">
          <ThemeToggle activeTab={activeTab} onChange={handleTabChange} isMobile={true} />
        </div>
      )}

      {!isMobile && (
        <div
          className="app-top-controls"
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: `${spacing.md} 0`,
          }}
        >
          <UserSelection activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      )}

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
        {!currentUser && (
          <section
            aria-label="Profile notice"
            style={{
              marginBottom: spacing.lg,
              padding: spacing.md,
              borderRadius: radius.lg,
              border: `1px solid ${colors.borderSecondary}`,
              background: colors.surface1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.md,
              flexWrap: 'wrap',
            }}
          >
            <p
              style={{
                margin: 0,
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
              }}
            >
              You’re in guest mode. Choose a profile to save your updates.
            </p>
            <button
              type="button"
              onClick={() => setShowProfileSheet(true)}
              className="profile-select-cta"
              style={{
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}`,
                background: colors.surface2,
                color: colors.textPrimary,
              }}
            >
              Choose profile
            </button>
          </section>
        )}

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

      {isMobile && (
        <ThemeToggle activeTab={activeTab} onChange={handleTabChange} isMobile={true} />
      )}

      <BottomSheet
        isOpen={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
        title="Choose Your Experience"
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
          Pick a profile for personalized updates and saved actions.
        </p>
        <UserSelection onUserSelected={() => setShowProfileSheet(false)} activeTab={activeTab} onTabChange={handleTabChange} />
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
  );
};

const App: React.FC = () => (
  <BubbleDismissProvider>
    <AppInner />
  </BubbleDismissProvider>
);

export default App;
