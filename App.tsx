import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './context/UserContext';
import { User } from './types';
import UserSelection from './components/UserSelection';
import Watchlist from './components/Watchlist';
import MessageBoard from './components/MessageBoard';
import IntroScreen from './components/quiz/IntroScreen';
import QuizFlow from './components/quiz/QuizFlow';
import { QuizResult } from './components/quiz/types';
import { spacing, colors, typography } from './design-system/tokens';

const App: React.FC = () => {
  const { currentUser } = useUser();
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
  const [showIntro, setShowIntro] = useState(!quizCompleted);

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
    setShowIntro(false);
    setShowQuiz(true);
  };

  const handleSkipQuiz = () => {
    setShowIntro(false);
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
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
      <main className="main-container" style={{ 
        paddingTop: spacing.xl, 
        paddingBottom: spacing['3xl'],
        paddingLeft: spacing.lg,
        paddingRight: spacing.lg,
        maxWidth: '100%',
      }}>
        <div className="transition-container">
          {showIntro ? (
            <div className={animationClass}>
              <IntroScreen onStartQuiz={handleStartQuiz} onSkip={handleSkipQuiz} />
            </div>
          ) : showQuiz ? (
            <div className={animationClass}>
              <QuizFlow onComplete={handleQuizComplete} />
            </div>
          ) : !displayUser ? (
            <div className={animationClass}>
              <UserSelection />
            </div>
          ) : (
            <div className={animationClass}>
              <Watchlist />
            </div>
          )}
        </div>
        {!showIntro && !showQuiz && <MessageBoard />}
      </main>
    </div>
  );
};

export default App;