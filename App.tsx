import React, { useMemo, useState } from 'react';
import { useAudio } from './hooks/useAudio';
import { useUser } from './context/UserContext';
import { MainTab } from './types';
import { useQuiz } from './hooks/useQuiz';
import { useMediaQuery, breakpoints } from './hooks/useMediaQuery';
import Watchlist from './components/watchlist';
import MessageBoard from './components/common/MessageBoard';
import SnakeGame from './components/snake/SnakeGame';
import SpinWheel from './components/extras/spin-wheel/SpinWheel';
import MatchmakerBubble from './components/matchmaker/MatchmakerBubble';
import QuizFlow from './components/quiz/QuizFlow';
import QuizEditor from './components/quiz/QuizEditor';
import ExtrasHub from './components/main/ExtrasHub';
import PlacesList from './components/places/PlacesList';
import TabBar from './components/ui/TabBar';
import { spacing, colors, typography, layout, shadows, radius } from './design-system/tokens';
import './App.css';

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'queue', label: 'Movies', icon: '🎬' },
  { id: 'places', label: 'Places', icon: '📍' },
  { id: 'extras', label: 'Extras', icon: '🎰' },
];

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const isMobile = useMediaQuery(breakpoints.sm);
  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const { quizData } = useQuiz(true);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  const handleTabChange = (tab: MainTab) => {
    if (tab !== activeTab) {
      playSwitch();
    }
    setActiveTab(tab);
  };

  const handleStartQuiz = () => {
    setActiveTab('extras');
    setShowQuizEditor(false);
    setShowQuiz(true);
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
    setActiveTab('queue');
  };

  const handleRetakeQuiz = () => {
    setActiveTab('extras');
    setShowQuizEditor(false);
    setShowQuiz(true);
  };

  const handleOpenQuizEditor = () => {
    setActiveTab('extras');
    setShowQuiz(false);
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
      case 'extras': {
        if (showQuiz && quizData) {
          return <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />;
        }

        if (showQuizEditor) {
          return <QuizEditor onClose={() => setShowQuizEditor(false)} />;
        }

        return (
          <ExtrasHub
            currentUser={currentUser}
            quizCompleted={quizCompleted}
            onStartQuiz={handleStartQuiz}
            onRetakeQuiz={handleRetakeQuiz}
            onOpenQuizEditor={handleOpenQuizEditor}
            initialView="all"
          />
        );
      }
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

      <header
        className="app-header"
        style={{
          height: layout.topBarHeight,
          background: colors.surface1,
          borderBottom: `1px solid ${colors.borderSubtle}`,
          boxShadow: shadows.card,
        }}
      >
        <div className="app-header-inner" style={{ maxWidth: layout.contentMaxWidth }}>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.lg,
                lineHeight: 1.2,
                letterSpacing: typography.letterSpacing.normal,
              }}
            >
              Aaron &amp; Electra
            </h1>
            <p
              style={{
                margin: 0,
                color: colors.textTertiary,
                fontSize: typography.fontSize.xs,
              }}
            >
              Movies & Places
            </p>
          </div>

          <button
            type="button"
            className="profile-chip"
            onClick={() => setShowProfileSheet(true)}
            aria-label="Open profile options"
            title="Open profile options"
            style={{
              borderRadius: radius.full,
              border: `1px solid ${colors.border}`,
              background: colors.surface2,
              color: colors.textPrimary,
            }}
          >
            <span aria-hidden>{currentUser ? '👤' : '👥'}</span>
            <span>{currentUser || 'Guest'}</span>
          </button>
        </div>
      </header>

      {!isMobile && (
        <div className="app-top-tabs" style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
          <TabBar tabs={MAIN_TABS} activeTab={activeTab} onChange={handleTabChange} />
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
              You are in guest mode. Pick Aaron or Electra to make personal updates.
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
              Choose Profile
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
        <TabBar tabs={MAIN_TABS} activeTab={activeTab} onChange={handleTabChange} mobileFixed />
      )}

      <MessageBoard mode="floating" />
      <SpinWheel mode="floating" />
      <SnakeGame mode="floating" />
      <MatchmakerBubble currentUser={currentUser} />
    </div>
  );
};

export default App;
