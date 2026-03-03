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
import { spacing, colors, typography, layout, shadows, radius } from './design-system/tokens';

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'queue', label: 'Movies', icon: '🎬' },
  { id: 'places', label: 'Places', icon: '📍' },
  { id: 'extras', label: 'Extras', icon: '🎰' },
];

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const { quizData } = useQuiz(true);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [isHomeCollapsed, setIsHomeCollapsed] = useState(false);

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
    setActiveTab('queue');
    setIsHomeCollapsed(true);
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
        return (
          <div className="animate-fade-in">
            {!isHomeCollapsed && <Dashboard onNavigate={setActiveTab} />}
            {isHomeCollapsed && <Watchlist />}
          </div>
        );
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
            {!isHomeCollapsed && <Dashboard onNavigate={setActiveTab} />}
            {isHomeCollapsed && <PlacesList />}
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
        background: `fixed linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)`,
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Avatar-inspired glowing orbs background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        <div className="bg-orb" style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 20s infinite alternate ease-in-out',
        }} />
        <div className="bg-orb" style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 25s infinite alternate-reverse ease-in-out',
        }} />
        <div className="bg-orb" style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '30vw',
          height: '30vw',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 18s infinite alternate ease-in-out',
        }} />
        
        {/* Bioluminescent "Particles" */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          opacity: 0.5,
        }} />
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(5%, 10%) scale(1.1); }
        }
          .bg-orb {
            mix-blend-mode: screen;
          }
          .bioluminescent-grid {
            mask-image: radial-gradient(circle at center, black, transparent 80%);
          }
        `}</style>

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
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            borderTop: `2px solid rgba(255, 255, 255, 0.2)`,
            background:
              'linear-gradient(165deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            boxShadow: `0 14px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
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
          @keyframes bubble-pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          .main-nav-tile {
            position: relative;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          }
          .main-nav-tile:hover {
            transform: translateY(-5px) scale(1.05);
          }
          .main-nav-tile:active {
            transform: scale(0.9);
          }
          .main-nav-tile.active-bubble {
            animation: bubble-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .main-nav-tile:focus-visible {
            outline: 2px solid ${colors.accent};
            outline-offset: 2px;
          }
          .main-nav-tile:not([aria-current="page"]):hover {
            background: rgba(255,255,255,0.12) !important;
            box-shadow: 0 8px 16px rgba(255,105,180,0.3);
          }
        `}</style>
        <div
          role="region"
          aria-label="Main navigation"
          style={{
            width: '100%',
            minWidth: 0,
            background: 'rgba(23, 33, 58, 0.3)',
            backdropFilter: 'blur(16px)',
            borderRadius: radius.full,
            border: `1px solid ${colors.borderSecondary}20`,
            padding: '6px',
            marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
          }}
        >
          <nav
            aria-label="Tab navigation"
            className="nav-scroll-hide"
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              overflowX: 'auto',
            }}
          >
            {MAIN_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`main-nav-tile ${isActive ? 'active-bubble' : ''}`}
                  onClick={() => {
                    playSwitch();
                    setActiveTab(tab.id);
                    setIsHomeCollapsed(true);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    flex: '1 1 0',
                    minWidth: '80px',
                    maxWidth: '160px',
                    minHeight: '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    background: isActive ? colors.gradientPink : 'rgba(255,255,255,0.06)',
                    border: isActive ? `2px solid ${colors.accent}` : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: radius.full,
                    padding: '8px 12px',
                    color: isActive ? '#1a1a2e' : colors.textSecondary,
                    fontFamily: typography.fontFamily.heading.join(', '),
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    boxShadow: isActive ? `0 0 15px ${colors.accent}60` : 'none',
                  }}
                >
                  <span style={{ fontSize: '1.4em', lineHeight: 1 }} aria-hidden>
                    {tab.icon}
                  </span>
                  <span style={{ lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab !== 'extras' && activeTab !== 'messages' && !isHomeCollapsed && (
          <div style={{ marginBottom: spacing.md }}>
            <Dashboard 
              onNavigate={(tab) => {
                setActiveTab(tab);
                setIsHomeCollapsed(true);
              }} 
            />
          </div>
        )}

        {isHomeCollapsed && renderContent()}
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
