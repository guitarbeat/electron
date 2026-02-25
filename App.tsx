import React, { useState } from 'react';
import { useUser } from './context/UserContext';
import { MainTab } from './types';
import { useQuiz } from './hooks/useQuiz';
import Watchlist from './components/watchlist';
import UserSelection from './components/UserSelection';
import MessageBoard from './components/MessageBoard';
import QuizFlow from './components/quiz/QuizFlow';
import QuizEditor from './components/quiz/QuizEditor';
import ProfileSheet from './components/main/ProfileSheet';
import ExtrasHub from './components/main/ExtrasHub';
import { spacing, colors, typography, layout, shadows } from './design-system/tokens';
import { useMediaQuery, breakpoints } from './hooks/useMediaQuery';

const App: React.FC = () => {
  const { currentUser } = useUser();
  const isMobile = useMediaQuery(breakpoints.sm);
  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const { quizData } = useQuiz(true);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [isSkipLinkFocused, setIsSkipLinkFocused] = useState(false);

  const handleStartQuiz = () => {
    setActiveTab('quiz');
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
    setActiveTab('quiz');
    setShowQuizEditor(false);
    setShowQuiz(true);
  };

  const handleOpenQuizEditor = () => {
    setActiveTab('quiz');
    setShowQuiz(false);
    setShowQuizEditor(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'queue':
        return <Watchlist />;
      case 'spin':
        return (
          <div className="animate-fade-in">
            <ExtrasHub
              currentUser={currentUser}
              quizCompleted={quizCompleted}
              onStartQuiz={handleStartQuiz}
              onRetakeQuiz={handleRetakeQuiz}
              onOpenQuizEditor={handleOpenQuizEditor}
              initialView="spin"
            />
          </div>
        );
      case 'games':
        return (
          <div className="animate-fade-in">
            <ExtrasHub
              currentUser={currentUser}
              quizCompleted={quizCompleted}
              onStartQuiz={handleStartQuiz}
              onRetakeQuiz={handleRetakeQuiz}
              onOpenQuizEditor={handleOpenQuizEditor}
              initialView="games"
            />
          </div>
        );
      case 'quiz':
        return (
          <div className="animate-fade-in">
            {showQuiz && quizData ? (
              <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />
            ) : showQuizEditor ? (
              <QuizEditor onClose={() => setShowQuizEditor(false)} />
            ) : (
              <ExtrasHub
                currentUser={currentUser}
                quizCompleted={quizCompleted}
                onStartQuiz={handleStartQuiz}
                onRetakeQuiz={handleRetakeQuiz}
                onOpenQuizEditor={handleOpenQuizEditor}
                initialView="quiz"
              />
            )}
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

      {/* Main Content */}
      <main
        id="main-content"
        className="main-container"
        style={{
          paddingTop: spacing.md,
          paddingBottom: isMobile
            ? `calc(${spacing.lg} + env(safe-area-inset-bottom, 0px))`
            : spacing['3xl'],
          paddingLeft: isMobile ? spacing.md : spacing.lg,
          paddingRight: isMobile ? spacing.md : spacing.lg,
          maxWidth: layout.contentMaxWidth,
          margin: '0 auto',
          outline: 'none',
        }}
        tabIndex={-1}
      >
        <section
          aria-label="Profile selection"
          className="animate-fade-in"
          style={{
            maxWidth: '980px',
            margin: `0 auto ${spacing.lg}`,
            padding: isMobile ? spacing.sm : spacing.md,
            borderRadius: spacing.lg,
            border: `1px solid ${colors.borderSecondary}35`,
            background:
              'radial-gradient(circle at 10% 0%, rgba(255, 105, 180, 0.15), rgba(255, 105, 180, 0)), linear-gradient(145deg, rgba(23, 33, 58, 0.76), rgba(14, 23, 43, 0.82))',
            boxShadow: '0 14px 28px rgba(0,0,0,0.3)',
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: spacing.sm,
              textAlign: 'center',
              color: colors.textTertiary,
              fontSize: typography.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Who&apos;s watching
          </p>
          <UserSelection />
        </section>

        {/* Unified Command Bar */}
        <nav
          aria-label="Main navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            marginBottom: activeTab === 'queue' ? 0 : spacing.xl,
            padding: '4px',
            background: 'rgba(23, 33, 58, 0.5)',
            backdropFilter: 'blur(12px)',
            borderRadius: activeTab === 'queue' ? `${spacing.md} ${spacing.md} 0 0` : spacing.md,
            border: `1px solid ${colors.borderSecondary}25`,
            borderBottom: activeTab === 'queue' ? 'none' : `1px solid ${colors.borderSecondary}25`,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { id: 'queue', label: 'Queue', icon: '📋' },
            { id: 'spin', label: 'Spin', icon: '🎰' },
            { id: 'games', label: 'Games', icon: '🎮' },
            { id: 'quiz', label: 'Quiz', icon: '❓' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${colors.accent}25, ${colors.secondary}15)`
                    : 'transparent',
                  border: isActive ? `1px solid ${colors.accent}40` : '1px solid transparent',
                  borderRadius: `calc(${spacing.md} - 4px)`,
                  padding: `${spacing.sm} ${isMobile ? spacing.md : spacing.lg}`,
                  color: isActive ? colors.accent : colors.textSecondary,
                  fontFamily: typography.fontFamily.heading.join(', '),
                  fontSize: isMobile ? typography.fontSize.sm : typography.fontSize.base,
                  fontWeight: isActive ? '700' : '500',
                  textTransform: 'uppercase',
                  letterSpacing: typography.letterSpacing.wider,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  textShadow: isActive ? shadows.textGlow : 'none',
                  boxShadow: isActive ? `0 0 16px ${colors.accent}20` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: isMobile ? '14px' : '16px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {renderContent()}
      </main>

      <MessageBoard mode="floating" />

      <ProfileSheet isOpen={showProfileSheet} onClose={() => setShowProfileSheet(false)} />
    </div>
  );
};

export default App;
