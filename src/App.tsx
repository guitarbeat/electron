import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FrameEffect from '@/components/effects/FrameEffect';
import LoadingSequence from '@/components/effects/LoadingSequence';
import Moire from '@/components/effects/Moire';
import RetroEffects from '@/components/effects/RetroEffects';
import UserSelection from '@/components/common/UserSelection';
import PlacesList from '@/components/places/PlacesList';
import Watchlist from '@/components/watchlist';
import { buildQuizModals } from '@/app/buildMinigameModals';
import { getQuizLaunchState, getWorkspaceMeta } from '@/app/shellState';
import { ThemeProvider, ToastProvider, UserProvider, useUser } from '@/context';
import { colors, spacing, typography } from '@/design-system';
import { useAudio } from '@/hooks/useAudio';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useQuiz } from '@/hooks/useQuiz';
import type { MainTab } from '@/types';
import Button from '@/ui/Button';
import Card from '@/ui/Card';
import MinigameModal from '@/ui/MinigameModal';
import ThemeToggle from '@/ui/ThemeToggle';
import './App.css';

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const { quizData } = useQuiz();
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(
    () => localStorage.getItem('quizCompleted') === 'true'
  );
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizFlow, setShowQuizFlow] = useState(false);
  const [showLoadingSequence, setShowLoadingSequence] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [crtEnabled] = useState<boolean>(() => localStorage.getItem('crtEnabled') === 'true');
  const [cursorTrailEnabled] = useState<boolean>(
    () => localStorage.getItem('cursorTrailEnabled') === 'true'
  );

  useEffect(() => {
    document.body.setAttribute('data-theme', activeTab === 'places' ? 'places' : 'movies');
  }, [activeTab]);

  const openQuizExperience = useCallback(() => {
    if (currentUser) {
      setShowQuizFlow(true);
      return;
    }

    setShowQuizEditor(true);
  }, [currentUser]);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      if (tab === activeTab) return;
      playSwitch();
      setActiveTab(tab);
    },
    [activeTab, playSwitch]
  );

  const handleQuizComplete = useCallback(() => {
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
    setShowQuizFlow(false);
  }, []);

  const quizModals = useMemo(
    () =>
      buildQuizModals({
        showQuizEditor,
        showQuizFlow,
        quizCompleted,
        quizData,
        currentUser,
        setShowQuizEditor,
        setShowQuizFlow,
        onQuizComplete: handleQuizComplete,
      }),
    [currentUser, handleQuizComplete, quizCompleted, quizData, showQuizEditor, showQuizFlow]
  );

  const quizLaunch = getQuizLaunchState({ currentUser, quizCompleted, quizData });
  const workspaceMeta = getWorkspaceMeta(activeTab);
  const shouldShowLoadingSequence = showLoadingSequence && !prefersReducedMotion;
  const isMoireVisible = !showLoadingSequence && !prefersReducedMotion;
  const quizFacts = [
    currentUser ? `${currentUser} active` : 'Guest mode',
    `${quizData?.questions.length ?? 0} prompts`,
    quizCompleted ? 'Retake ready' : currentUser ? 'Fresh run' : 'Editor access',
  ];

  return (
    <ThemeProvider activeTab={activeTab}>
      {shouldShowLoadingSequence && (
        <LoadingSequence
          onComplete={() => setShowLoadingSequence(false)}
        />
      )}
      <RetroEffects crtEnabled={crtEnabled} cursorTrailEnabled={cursorTrailEnabled} />
      <FrameEffect>
        <div className="app-shell bg-main" style={{ minHeight: '100vh', backgroundColor: colors.background }}>
          {!prefersReducedMotion && <Moire isVisible={isMoireVisible} />}
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>

          <div className="app-frame" style={{ position: 'relative', minHeight: '100vh' }}>
            <main id="main-content" className="workspace-stage workspace-stage--simplified" tabIndex={-1}>
              <section className="duo-status-shell" aria-label="Profiles and shared ritual">
                <div className="duo-status-shell__grid">
                  <UserSelection
                    variant="panel"
                    title="Who's steering tonight?"
                    subtitle="Pick the seat that should shape suggestions, memories, and quiz runs."
                    className="duo-status-shell__selection"
                  />

                  <Card
                    variant="default"
                    className="duo-status-card duo-status-card--quiz"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.lg,
                      padding: isMobile ? spacing.lg : spacing.xl,
                      border: `1px solid ${colors.borderSubtle}`,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                      <p className="duo-status-card__eyebrow">Shared Ritual</p>
                      <h2 className="duo-status-card__title">Compatibility Quiz</h2>
                      <p className="duo-status-card__copy">{quizLaunch.description}</p>
                    </div>

                    <div className="duo-status-card__facts" aria-label="Quiz status">
                      {quizFacts.map((fact) => (
                        <span key={fact} className="duo-status-card__fact">
                          {fact}
                        </span>
                      ))}
                    </div>

                    <Button
                      size={isMobile ? 'md' : 'lg'}
                      onClick={openQuizExperience}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {quizLaunch.label}
                    </Button>
                  </Card>
                </div>
              </section>

              <section className="workspace-header workspace-header--simplified" aria-label="Workspace controls">
                <p className="workspace-header__active">
                  <span className="workspace-header__active-icon">{workspaceMeta.icon}</span>
                  {workspaceMeta.eyebrow}
                </p>
                <h1 className="workspace-header__title">
                  <span className="workspace-header__title-icon" aria-hidden="true">
                    {workspaceMeta.icon}
                  </span>
                  {workspaceMeta.title}
                </h1>
                <p
                  className="workspace-header__summary"
                  style={{
                    margin: 0,
                    maxWidth: '52rem',
                    textAlign: 'center',
                    color: colors.textSecondary,
                    ...typography.presets.bodySm,
                  }}
                >
                  {workspaceMeta.description}
                </p>
                <div className="workspace-header__controls workspace-header__controls--toggle">
                  <ThemeToggle
                    activeTab={activeTab}
                    onChange={handleTabChange}
                    compact={isMobile}
                    className="workspace-header__toggle"
                    label="Switch between Watchlist and Date Spots"
                  />
                </div>
              </section>

              <section className="workspace-surface" aria-label="Primary workspace" style={{ minWidth: 0 }}>
                {activeTab === 'queue' ? (
                  <Watchlist isMobile={isMobile} />
                ) : (
                  <PlacesList isMobile={isMobile} />
                )}
              </section>
            </main>
          </div>

          {quizModals.map((modal) => (
            <MinigameModal
              key={modal.key}
              isOpen={modal.isOpen}
              onClose={modal.onClose}
              title={modal.title}
              ariaLabel={modal.ariaLabel}
              maxWidth={modal.maxWidth}
              maxHeight={modal.maxHeight}
              closeDisabled={modal.closeDisabled}
              closeDisabledLabel={modal.closeDisabledLabel}
            >
              <div style={modal.contentStyle ?? { flex: 1, overflowY: 'auto' }}>
                {modal.content}
              </div>
            </MinigameModal>
          ))}
        </div>
      </FrameEffect>
    </ThemeProvider>
  );
};

const AppWithProviders: React.FC = () => (
  <UserProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </UserProvider>
);

export default AppWithProviders;
