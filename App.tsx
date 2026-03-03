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
  const [expandedTabs, setExpandedTabs] = useState<Set<MainTab>>(new Set());

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
    setExpandedTabs(new Set());
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

  const isTabExpanded = (tab: MainTab) => expandedTabs.has(tab);

  const toggleTab = (tab: MainTab) => {
    playSwitch();
    const newExpanded = new Set(expandedTabs);
    if (newExpanded.has(tab)) {
      newExpanded.delete(tab);
    } else {
      newExpanded.add(tab);
    }
    setExpandedTabs(newExpanded);
    setActiveTab(tab);
  };

  const renderContent = () => {
    const expanded = isTabExpanded(activeTab);

    switch (activeTab) {
      case 'queue':
        return (
          <div className="animate-fade-in">
            {!expanded && (
              <Dashboard
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  setExpandedTabs(new Set([tab]));
                }}
              />
            )}
            {expanded && <Watchlist />}
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
            {!expanded && (
              <Dashboard
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  setExpandedTabs(new Set([tab]));
                }}
              />
            )}
            {expanded && <PlacesList />}
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
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          className="bg-orb"
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '60vw',
            height: '60vw',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'float 20s infinite alternate ease-in-out',
          }}
        />
        <div
          className="bg-orb"
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '50vw',
            height: '50vw',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'float 25s infinite alternate-reverse ease-in-out',
          }}
        />
        <div
          className="bg-orb"
          style={{
            position: 'absolute',
            top: '30%',
            right: '10%',
            width: '30vw',
            height: '30vw',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'float 18s infinite alternate ease-in-out',
          }}
        />

        {/* Bioluminescent "Particles" */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
            opacity: 0.5,
          }}
        />
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

        {/* Y2K Bubble Navigation */}
        <style>{`
          @keyframes bubble-pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          @keyframes bubble-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .bubble-nav {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: clamp(1rem, 3vw, 2.5rem);
            padding: clamp(1.5rem, 4vw, 2.5rem);
            margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
            flex-wrap: wrap;
          }
          .nav-bubble {
            position: relative;
            width: 120px;
            height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: none;
            background: none;
            padding: 0;
            font-family: ${typography.fontFamily.heading.join(', ')};
          }
          .nav-bubble:focus-visible {
            outline: 3px solid ${colors.accent};
            outline-offset: 4px;
          }
          .nav-bubble-inner {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
          }
          .nav-bubble:hover .nav-bubble-inner {
            transform: scale(1.1);
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
          }
          .nav-bubble:active .nav-bubble-inner {
            transform: scale(0.95);
          }
          .nav-bubble.on .nav-bubble-inner {
            animation: bubble-float 3s ease-in-out infinite;
          }
          .nav-bubble.on .nav-bubble-inner::before {
            animation: bubble-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .nav-bubble-icon {
            font-size: 2.2rem;
            line-height: 1;
            z-index: 2;
          }
          .nav-bubble-label {
            font-size: 0.75rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            z-index: 2;
            text-align: center;
            max-width: 100%;
          }
          .nav-bubble-status {
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            z-index: 2;
          }
        `}</style>
        <nav role="region" aria-label="Main navigation" className="bubble-nav">
          {MAIN_TABS.map((tab) => {
            const isOn = isTabExpanded(tab.id);
            const bubbleColors = {
              queue: {
                on: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                off: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              },
              places: {
                on: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                off: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
              },
              extras: {
                on: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                off: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
              },
            };
            const colorsMap = bubbleColors[tab.id as keyof typeof bubbleColors];

            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-bubble ${isOn ? 'on' : 'off'}`}
                onClick={() => toggleTab(tab.id)}
                title={isOn ? 'Turn off' : 'Turn on'}
              >
                <div
                  className="nav-bubble-inner"
                  style={{
                    background: isOn ? colorsMap.on : colorsMap.off,
                  }}
                >
                  <span className="nav-bubble-icon" aria-hidden>
                    {tab.icon}
                  </span>
                  <span className="nav-bubble-label">{tab.label}</span>
                  <span className="nav-bubble-status">{isOn ? 'ON' : 'OFF'}</span>
                </div>
              </button>
            );
          })}
        </nav>

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
