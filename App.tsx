import React, { useState } from 'react';
import { useUser } from './context/UserContext';
import { MainTab } from './types';
import { useQuiz } from './hooks/useQuiz';
import Watchlist from './components/Watchlist';
import UserSelection from './components/UserSelection';
import MessageBoard from './components/MessageBoard';
import QuizFlow from './components/quiz/QuizFlow';
import QuizEditor from './components/quiz/QuizEditor';
import ProfileSheet from './components/main/ProfileSheet';
import ExtrasHub from './components/main/ExtrasHub';
import { spacing, colors, typography, layout } from './design-system/tokens';
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
    setActiveTab('extras');
    setShowQuizEditor(false);
    setShowQuiz(true);
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
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
              'radial-gradient(circle at 10% 0%, rgba(255, 105, 180, 0.2), rgba(255, 105, 180, 0)), linear-gradient(145deg, rgba(23, 33, 58, 0.76), rgba(14, 23, 43, 0.82))',
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

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.md,
            marginBottom: spacing.xl,
            borderBottom: `1px solid ${colors.borderSecondary}20`,
            paddingBottom: spacing.md,
          }}
        >
          <button
            onClick={() => setActiveTab('queue')}
            style={{
              background: 'none',
              border: 'none',
              padding: `${spacing.sm} ${spacing.lg}`,
              color: activeTab === 'queue' ? colors.accent : colors.textSecondary,
              fontSize: typography.fontSize.base,
              fontWeight: activeTab === 'queue' ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === 'queue' ? `2px solid ${colors.accent}` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Queue
          </button>
          <button
            onClick={() => setActiveTab('extras')}
            style={{
              background: 'none',
              border: 'none',
              padding: `${spacing.sm} ${spacing.lg}`,
              color: activeTab === 'extras' ? colors.accent : colors.textSecondary,
              fontSize: typography.fontSize.base,
              fontWeight: activeTab === 'extras' ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === 'extras' ? `2px solid ${colors.accent}` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Extras
          </button>
        </div>

        {activeTab === 'queue' ? (
          <Watchlist />
        ) : (
          <div className="animate-fade-in">
            {showQuiz ? (
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
              />
            )}
          </div>
        )}
      </main>

      <MessageBoard mode="floating" />

      <ProfileSheet isOpen={showProfileSheet} onClose={() => setShowProfileSheet(false)} />
    </div>
  );
};

export default App;
