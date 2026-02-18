import React, { useState } from 'react';
import { useUser } from './context/UserContext';
import { MainTab } from './types';
import { useQuiz } from './hooks/useQuiz';
import Watchlist from './components/Watchlist';
import UserSelection from './components/UserSelection';
import MessageBoard from './components/MessageBoard';
import QuizFlow from './components/quiz/QuizFlow';
import QuizEditor from './components/quiz/QuizEditor';
import MainTopBar from './components/main/MainTopBar';
import MainTabNav from './components/main/MainTabNav';
import ProfileSheet from './components/main/ProfileSheet';
import ExtrasHub from './components/main/ExtrasHub';
import { spacing, colors, typography, layout } from './design-system/tokens';
import { useMediaQuery, breakpoints } from './hooks/useMediaQuery';

const App: React.FC = () => {
  const { currentUser } = useUser();
  const isMobile = useMediaQuery(breakpoints.sm);
  const { quizData, isLoading: isQuizLoading } = useQuiz();
  const [activeTab, setActiveTab] = useState<MainTab>('queue');
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

      <MainTopBar
        activeTab={activeTab}
        currentUser={currentUser}
        onOpenProfile={() => setShowProfileSheet(true)}
      />

      {!isMobile && <MainTabNav activeTab={activeTab} onTabChange={setActiveTab} />}

      <main
        id="main-content"
        className="main-container"
        style={{
          paddingTop: spacing.md,
          paddingBottom: isMobile
            ? `calc(${layout.tabBarHeight} + ${spacing.lg} + env(safe-area-inset-bottom, 0px))`
            : spacing['3xl'],
          paddingLeft: isMobile ? spacing.md : spacing.lg,
          paddingRight: isMobile ? spacing.md : spacing.lg,
          maxWidth: '100%',
          outline: 'none',
        }}
        tabIndex={-1}
      >
        <div
          style={{
            maxWidth: layout.contentMaxWidth,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: activeTab === 'queue' || activeTab === 'memories' ? 'block' : 'none',
            }}
            aria-hidden={activeTab !== 'queue' && activeTab !== 'memories'}
          >
            {activeTab === 'queue' && (
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
            )}
            <Watchlist surface={activeTab === 'memories' ? 'memories' : 'queue'} />
          </div>

          {activeTab === 'messages' && (
            <div
              style={{
                maxWidth: '960px',
                margin: '0 auto',
              }}
            >
              <MessageBoard mode="embedded" />
            </div>
          )}

          {activeTab === 'extras' && (
            <div className="animate-fade-in" style={{ width: '100%' }}>
              {showQuizEditor ? (
                <QuizEditor onClose={() => setShowQuizEditor(false)} />
              ) : showQuiz ? (
                isQuizLoading || !quizData ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: spacing['2xl'],
                      color: colors.textSecondary,
                    }}
                  >
                    Loading quiz...
                  </div>
                ) : (
                  <QuizFlow onComplete={handleQuizComplete} quizData={quizData} />
                )
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
        </div>
      </main>

      {isMobile && <MainTabNav activeTab={activeTab} onTabChange={setActiveTab} />}

      {activeTab !== 'messages' && <MessageBoard mode="floating" />}

      <ProfileSheet isOpen={showProfileSheet} onClose={() => setShowProfileSheet(false)} />
    </div>
  );
};

export default App;
