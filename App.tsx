import React, { useState } from 'react';
import { useAudio } from './hooks/useAudio';
import { useUser } from './context/UserContext';
import { MainTab } from './types';
import { useQuiz } from './hooks/useQuiz';
import Watchlist from './components/watchlist';
import UserSelection from './components/common/UserSelection';
import MessageBoard from './components/common/MessageBoard';
import SnakeGame from './components/snake/SnakeGame';
import SpinWheel from './components/extras/spin-wheel/SpinWheel';
import MatchmakerBubble from './components/matchmaker/MatchmakerBubble';
import QuizFlow from './components/quiz/QuizFlow';
import QuizEditor from './components/quiz/QuizEditor';
import ProfileSheet from './components/main/ProfileSheet';
import ExtrasHub from './components/main/ExtrasHub';
import Dashboard from './components/main/Dashboard';
import PlacesList from './components/places/PlacesList';
import { spacing, colors, typography, layout, shadows } from './design-system/tokens';

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'queue', label: 'Movies', icon: '🎬' },
  { id: 'places', label: 'Places', icon: '📍' },
  { id: 'extras', label: 'Extras', icon: '🎰' },
];

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const { quizData } = useQuiz(true);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [isSkipLinkFocused, setIsSkipLinkFocused] = useState(false);

  const handleStartQuiz = () => {
    setActiveTab('extras');
    setShowQuizEditor(false);
    setShowQuiz(true);
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
    setActiveTab('home');
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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="animate-fade-in">
            <Dashboard onNavigate={setActiveTab} />
          </div>
        );
      case 'queue':
        return <Watchlist />;
      case 'extras': {
        let content;
        if (showQuiz && quizData) {
          content = <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />;
        } else if (showQuizEditor) {
          content = <QuizEditor onClose={() => setShowQuizEditor(false)} />;
        } else {
          content = (
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
        return <div className="animate-fade-in">{content}</div>;
      }
      case 'places':
        return (
          <div className="animate-fade-in">
            <PlacesList />
          </div>
        );
      case 'messages':
        return <MessageBoard mode="embedded" />;
      default:
        return <Watchlist />;
    }
  };

  return (
    <div
      className="bg-main"
      style={{
        color: colors.textPrimary,
        minHeight: '100vh',
        fontFamily: typography.fontFamily.body.join(', '),
      }}
    >
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: isSkipLinkFocused ? '0' : '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: colors.surfaceElevated,
          color: colors.accent,
          padding: `${spacing.sm} ${spacing.lg}`,
          zIndex: 9999,
          transition: 'top 0.2s',
          borderRadius: `0 0 ${spacing.md} ${spacing.md}`,
          textDecoration: 'none',
          border: `2px solid ${colors.accent}`,
          borderTop: 'none',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          outline: 'none',
        }}
        onFocus={() => setIsSkipLinkFocused(true)}
        onBlur={() => setIsSkipLinkFocused(false)}
      >
        Skip to content
      </a>

      {/* Main Content - liquid layout, same structure at every size */}
      <main
        id="main-content"
        className="main-container"
        style={{
        paddingTop: 'clamp(0.5rem, 2vw, 1.5rem)',
          paddingBottom: 'clamp(0.75rem, 3vw, 3.5rem)',
          paddingLeft: 'clamp(0.5rem, 2vw, 1.5rem)',
          paddingRight: 'clamp(0.5rem, 2vw, 1.5rem)',
          maxWidth: layout.contentMaxWidth,
          margin: '0 auto',
          outline: 'none',
          overflow: 'visible',
        }}
        tabIndex={-1}
      >
        <section
          aria-label="Profile selection"
          className="animate-fade-in retro-card-shine"
          style={{
            maxWidth: '980px',
            margin: '0 auto clamp(0.5rem, 1.5vw, 1.25rem)',
            padding: 'clamp(0.35rem, 1vw, 1rem)',
            borderRadius: spacing.lg,
            border: `1px solid ${colors.accent}30`,
            borderTop: `2px solid ${colors.accent}50`,
            background:
              'radial-gradient(ellipse at 20% -20%, rgba(255, 105, 180, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 120%, rgba(135, 206, 250, 0.08) 0%, transparent 50%), linear-gradient(165deg, rgba(23, 33, 58, 0.85) 0%, rgba(10, 16, 32, 0.92) 100%)',
            boxShadow: `0 14px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(255, 105, 180, 0.06)`,
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: spacing.sm,
              textAlign: 'center',
              color: colors.accent,
              fontSize: typography.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              opacity: 0.7,
            }}
          >
            ✦ Who&apos;s watching ✦
          </p>
          <UserSelection />
          <hr className="retro-divider" />
        </section>

        {/* Main navigation - vertical tiles, icon on top / label below, liquid wrap */}
        <style>{`
          .main-nav-tile:focus-visible {
            outline: 2px solid ${colors.accent};
            outline-offset: 2px;
          }
          .main-nav-tile:not([aria-current="page"]):hover {
            background: rgba(255,255,255,0.08) !important;
            box-shadow: 0 0 12px rgba(255,105,180,0.2);
          }
        `}</style>
        <div
          role="region"
          aria-label="Main navigation"
          style={{
            width: '100%',
            minWidth: 0,
            background: 'rgba(23, 33, 58, 0.5)',
            backdropFilter: 'blur(12px)',
            borderRadius: spacing.md,
            border: `1px solid ${colors.borderSecondary}25`,
            borderBottom: `2px solid ${colors.accent}30`,
            marginBottom: 'clamp(0.5rem, 1.5vw, 1rem)',
          }}
        >
          <nav
            aria-label="Tab navigation"
            className="nav-scroll-hide"
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'stretch',
              justifyContent: 'center',
              gap: '2px',
              padding: '4px',
              overflowX: 'auto',
            }}
          >
            {MAIN_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="main-nav-tile"
                  onClick={() => {
                    playSwitch();
                    setActiveTab(tab.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    flex: '1 1 0',
                    minWidth: '70px',
                    maxWidth: '200px',
                    minHeight: '44px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                    background: isActive ? colors.gradientPink : 'rgba(255,255,255,0.04)',
                    border: isActive ? `2px solid ${colors.accent}` : '1px solid transparent',
                    borderRadius: `calc(${spacing.md} - 4px)`,
                    padding: '0.5em 0.75em',
                    color: isActive ? '#1a1a2e' : colors.textSecondary,
                    fontFamily: typography.fontFamily.heading.join(', '),
                    fontSize: 'clamp(0.7rem, 1.2vw + 0.5rem, 0.95rem)',
                    fontWeight: isActive ? 700 : 500,
                    textTransform: 'uppercase',
                    letterSpacing: typography.letterSpacing.normal,
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    textShadow: isActive ? shadows.textGlow : 'none',
                    boxShadow: isActive ? shadows.glow : 'none',
                  }}
                >
                  <span style={{ fontSize: '1.25em', lineHeight: 1, flexShrink: 0 }} aria-hidden>
                    {tab.icon}
                  </span>
                  <span style={{ lineHeight: 1.1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {renderContent()}
      </main>

      <MessageBoard mode="floating" />
      <SpinWheel mode="floating" />
      <SnakeGame mode="floating" />
      <MatchmakerBubble currentUser={currentUser} />

      <ProfileSheet isOpen={showProfileSheet} onClose={() => setShowProfileSheet(false)} />
    </div>
  );
};

export default App;
