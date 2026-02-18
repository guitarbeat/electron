import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './context/UserContext';
import { User } from './types';
import { useQuiz } from './hooks/useQuiz';
import UserSelection from './components/UserSelection';
import Watchlist from './components/Watchlist';
import MessageBoard from './components/MessageBoard';
import QuizFlow from './components/quiz/QuizFlow';
import QuizEditor from './components/quiz/QuizEditor';
import SnakeGame from './components/snake/SnakeGame';
import { spacing, colors, typography } from './design-system/tokens';
import { useMediaQuery, breakpoints } from './hooks/useMediaQuery';
import Button from './components/ui/Button';
import { SettingsIcon } from './components/icons';

const App: React.FC = () => {
  const { currentUser } = useUser();
  const isMobile = useMediaQuery(breakpoints.sm);
  const { quizData, isLoading: isQuizLoading } = useQuiz();
  const [displayUser, setDisplayUser] = useState<User | null>(currentUser);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationClass, setAnimationClass] = useState<string>('animate-fade-in');
  const prevUserRef = useRef<User | null>(currentUser);
  const isInitialMount = useRef(true);

  // Quiz state
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  useEffect(() => {
    // * Skip animation on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevUserRef.current = currentUser;
      // * Clear fade-in after initial animation completes
      setTimeout(() => setAnimationClass(''), 500);
      return;
    }

    // * Detects user state changes and triggers appropriate animations
    const wasLoggedOut = prevUserRef.current === null;
    const isNowLoggedIn = currentUser !== null;
    const wasLoggedIn = prevUserRef.current !== null;
    const isNowLoggedOut = currentUser === null;

    // * Determine transition type
    const isLogin = wasLoggedOut && isNowLoggedIn;
    const isLogout = wasLoggedIn && isNowLoggedOut;

    if (isLogin || isLogout) {
      setIsTransitioning(true);

      if (isLogin) {
        // * Login: UserSelection exits left, Watchlist enters from right
        setAnimationClass('animate-login-exit');
        setTimeout(() => {
          setDisplayUser(currentUser);
          setAnimationClass('animate-login-enter');
          setTimeout(() => {
            setIsTransitioning(false);
            setAnimationClass('');
          }, 500); // * Match animation duration
        }, 400); // * Match exit animation duration
      } else {
        // * Logout: Watchlist zooms out, UserSelection zooms in
        setAnimationClass('animate-logout-exit');
        setTimeout(() => {
          setDisplayUser(null);
          setAnimationClass('animate-logout-enter');
          setTimeout(() => {
            setIsTransitioning(false);
            setAnimationClass('');
          }, 500); // * Match animation duration
        }, 300); // * Match exit animation duration
      }
    }

    prevUserRef.current = currentUser;
  }, [currentUser]);

  // Quiz handlers
  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
  };

  const handleRetakeQuiz = () => {
    setShowQuiz(true);
  };

  const [isSkipLinkFocused, setIsSkipLinkFocused] = useState(false);

  // Show quiz editor
  if (showQuizEditor) {
    return (
      <div
        className="bg-main"
        style={{
          color: colors.textPrimary,
          minHeight: '100vh',
          fontFamily: typography.fontFamily.body.join(', '),
        }}
      >
        <main
          style={{
            paddingTop: spacing.xl,
            paddingBottom: spacing['3xl'],
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
            maxWidth: '100%',
          }}
        >
          <QuizEditor onClose={() => setShowQuizEditor(false)} />
        </main>
      </div>
    );
  }

  return (
    <div
      className="bg-main"
      style={{
        color: colors.textPrimary,
        minHeight: '100vh',
        fontFamily: typography.fontFamily.body.join(', '),
      }}
    >
      {/* Quiz Editor Button - Only visible when logged in */}
      {displayUser && !showQuiz && (
        <div
          style={{
            position: 'fixed',
            top: isMobile ? `max(${spacing.md}, env(safe-area-inset-top))` : 'auto',
            bottom: isMobile ? 'auto' : `max(${spacing.lg}, env(safe-area-inset-bottom))`,
            right: isMobile ? spacing.md : spacing.lg,
            zIndex: 100,
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowQuizEditor(true)}
            aria-label="Edit Quiz"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: isMobile ? '8px 12px' : undefined,
              fontSize: isMobile ? '12px' : undefined,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <SettingsIcon
              style={{
                width: isMobile ? '0.875rem' : '1rem',
                height: isMobile ? '0.875rem' : '1rem',
              }}
            />
            Edit Quiz
          </Button>
        </div>
      )}

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
      <main
        id="main-content"
        className="main-container"
        style={{
          paddingTop: spacing.xl,
          paddingBottom: spacing['3xl'],
          paddingLeft: spacing.lg,
          paddingRight: spacing.lg,
          maxWidth: '100%',
          outline: 'none', // Ensure programmatic focus doesn't show default ring unless needed
        }}
        tabIndex={-1} // Allow programmatic focus
      >
        <div className="transition-container">
          {showQuiz ? (
            <div className={animationClass}>
              {isQuizLoading || !quizData ? (
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
              )}
            </div>
          ) : (
            <div className={animationClass}>
              <div style={{ marginBottom: spacing.xl, width: '100%' }}>
                <UserSelection />
                <div
                  style={{
                    marginTop: spacing.md,
                    border: `1px solid ${colors.borderSecondary}40`,
                    borderRadius: spacing.md,
                    padding: isMobile ? spacing.sm : spacing.md,
                    background: 'rgba(18, 30, 55, 0.55)',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      marginBottom: spacing.xs,
                      fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
                      color: colors.textPrimary,
                    }}
                  >
                    Personality Quiz
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      marginBottom: spacing.sm,
                      fontSize: typography.fontSize.sm,
                      color: colors.textSecondary,
                    }}
                  >
                    {quizCompleted
                      ? 'Optional: retake it any time to refresh your match.'
                      : 'Optional: take it when you want, the watchlist is ready now.'}
                  </p>
                  <Button
                    variant={quizCompleted ? 'ghost' : 'secondary'}
                    size="sm"
                    onClick={quizCompleted ? handleRetakeQuiz : handleStartQuiz}
                    style={{
                      width: isMobile ? '100%' : 'auto',
                      fontSize: typography.fontSize.sm,
                    }}
                  >
                    {quizCompleted ? 'Retake quiz' : 'Take quiz'}
                  </Button>
                </div>
              </div>
              <Watchlist />
              <SnakeGame />
            </div>
          )}
        </div>
        {!showQuiz && currentUser && <MessageBoard />}
      </main>
    </div>
  );
};

export default App;
