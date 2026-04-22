import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildFeatureModals } from '@/app/buildMinigameModals';
import { readQuizCompletionState, writeQuizCompletionState } from '@/app/quizCompletionStorage';
import { getRequestedLogoVariant, isLogoLabEnabled } from '@/app/logoLab';
import { ThemeProvider, ToastProvider, UserProvider } from '@/app/providers';
import { useAppSession, useTheme, useUser } from '@/app/useProviders';
import AppHeader from '@/app/AppHeader';
import LoadingScreen from '@/app/LoadingScreen';
const MagicComponent = React.lazy(() => import('@/components/effects/Moire/Moire'));
const RetroEffects = React.lazy(() => import('@/components/effects/RetroEffects'));

const RadialMenu = React.lazy(() => import('@/components/effects/RadialMenu'));
import VignetteOverlay from '@/components/effects/VignetteOverlay';
const ElectronLogoLab = React.lazy(() => import('@/branding/ElectronLogoLab'));
import { useAudio } from '@/hooks/useAudio';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { MainTab } from '@/shared/types';

import MinigameModal from '@/ui/MinigameModal';
import './App.scss';

const AppWorkspaceShell = React.lazy(() => import('@/app/AppWorkspaceShell'));
const modalBodyStyle = { flex: 1, overflowY: 'auto' } satisfies React.CSSProperties;

/**
 * Reads the active theme tokens and feeds the Moiré shader its accent colors,
 * so the background stays color-linked to the rest of the UI.
 */
const ThemedMoire: React.FC = () => {
  const { themeTokens } = useTheme();
  return (
    <MagicComponent
      isVisible
      opacity={0.2}
      color1={themeTokens.accent}
      color2={themeTokens.secondary}
    />
  );
};

interface WorkspaceShellFallbackProps {
  activeTab: MainTab;
  isMobile: boolean;
}

const WorkspaceShellFallback: React.FC<WorkspaceShellFallbackProps> = ({
  activeTab,
  isMobile,
}) => {
  const cardCount = isMobile ? 2 : activeTab === 'places' ? 3 : 4;

  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
      aria-busy="true"
    >
      <section
        className={`workspace-surface workspace-surface--${activeTab} workspace-surface--loading`}
        style={{ minWidth: 0 }}
      >
        <section
          className="workspace-control-panel workspace-fallback-panel"
          aria-label="Loading workspace"
        >
          <div className="workspace-control-panel__header">
            <p className="workspace-control-panel__eyebrow">
              {activeTab === 'places' ? 'Places Workspace' : 'Movie Workspace'}
            </p>
            <h2 className="workspace-control-panel__title">
              {activeTab === 'places' ? 'Loading shared spots' : 'Loading movie night'}
            </h2>
            <p className="workspace-control-panel__copy">
              Keeping the home surface visible while the workspace bundle finishes loading.
            </p>
          </div>
          <div className="workspace-control-panel__meta">
            <span className="workspace-control-panel__pill">Shared state</span>
            <span className="workspace-control-panel__pill">Recent picks</span>
            <span className="workspace-control-panel__pill">Quick actions</span>
          </div>
        </section>

        <div className="workspace-fallback-grid" aria-hidden="true">
          {Array.from({ length: cardCount }, (_, index) => (
            <article key={`workspace-fallback-${index}`} className="workspace-fallback-card">
              <div className="workspace-fallback-card__poster skeleton" />
              <div className="workspace-fallback-card__copy">
                <span className="workspace-fallback-card__line workspace-fallback-card__line--title skeleton" />
                <span className="workspace-fallback-card__line workspace-fallback-card__line--meta skeleton" />
                <span className="workspace-fallback-card__line workspace-fallback-card__line--body skeleton" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { isSessionLoading } = useAppSession();
  const { playSwitch } = useAudio();
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() =>
    readQuizCompletionState(currentUser)
  );
  const [showMessages, setShowMessages] = useState(false);
  const [showMemoriesPanel, setShowMemoriesPanel] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizFlow, setShowQuizFlow] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showSpinWheelOnly, setShowSpinWheelOnly] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
  const [cursorTrailEnabled] = useState<boolean>(
    () => localStorage.getItem('cursorTrailEnabled') === 'true'
  );

  const logoLabState = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        enabled: false,
        initialVariant: undefined,
      };
    }

    return {
      enabled: isLogoLabEnabled(window.location.search),
      initialVariant: getRequestedLogoVariant(window.location.search),
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', activeTab === 'places' ? 'places' : 'movies');
  }, [activeTab]);

  useEffect(() => {
    setQuizCompleted(readQuizCompletionState(currentUser));
  }, [currentUser]);

  const updateQuizCompletion = useCallback(
    (completed: boolean) => {
      setQuizCompleted(completed);
      writeQuizCompletionState(currentUser, completed);
    },
    [currentUser]
  );

  const openQuizExperience = useCallback(() => {
    setShowQuizFlow(true);
  }, []);

  const handleQuizComplete = useCallback(() => {
    updateQuizCompletion(true);
    setShowQuizFlow(false);
  }, [updateQuizCompletion]);

  const handleQuizRetake = useCallback(() => {
    updateQuizCompletion(false);
  }, [updateQuizCompletion]);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      if (tab === activeTab) {
        return;
      }

      playSwitch();
      setActiveTab(tab);
    },
    [activeTab, playSwitch]
  );

  const openSpinMatch = useCallback(() => {
    setShowSpinWheel(true);
  }, []);

  const openSpinWheelOnly = useCallback(() => {
    setShowSpinWheelOnly(true);
  }, []);

  const featureModals = useMemo(
    () =>
      buildFeatureModals({
        showMessages,
        showMemoriesPanel,
        showQuizEditor,
        showQuizFlow,
        showSpinWheel,
        showSpinWheelOnly,
        showFavorites,
        quizCompleted,
        isSpinWheelLocked,
        currentUser,
        setShowMessages,
        setShowMemoriesPanel,
        setShowQuizEditor,
        setShowQuizFlow,
        setShowSpinWheel,
        setShowSpinWheelOnly,
        setShowFavorites,
        setIsSpinWheelLocked,
        onQuizComplete: handleQuizComplete,
        onQuizRetake: handleQuizRetake,
      }),
    [
      currentUser,
      handleQuizComplete,
      handleQuizRetake,
      isSpinWheelLocked,
      quizCompleted,
      showMemoriesPanel,
      showMessages,
      showQuizEditor,
      showQuizFlow,
      showSpinWheel,
      showSpinWheelOnly,
      showFavorites,
    ]
  );

  if (logoLabState.enabled) {
    return (
      <ThemeProvider activeTab={activeTab}>
        <React.Suspense fallback={null}>
          <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
        </React.Suspense>
        <div className="app-shell app-shell--viewport bg-main">
          <React.Suspense fallback={null}>
            {!prefersReducedMotion ? <MagicComponent isVisible /> : null}
          </React.Suspense>
          <VignetteOverlay />
          <React.Suspense fallback={null}>
            <ElectronLogoLab initialVariant={logoLabState.initialVariant} />
          </React.Suspense>
        </div>
      </ThemeProvider>
    );
  }

  if (isSessionLoading) {
    return (
      <ThemeProvider activeTab={activeTab}>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider activeTab={activeTab}>
      <React.Suspense fallback={null}>
        <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
      </React.Suspense>
      <div className="app-shell app-shell--viewport bg-main">
        <React.Suspense fallback={null}>
          {!prefersReducedMotion ? <ThemedMoire /> : null}
        </React.Suspense>
        <VignetteOverlay />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>


        <React.Suspense fallback={null}>
          <RadialMenu
            onOpenMessages={() => setShowMessages(true)}
            onOpenMemories={() => setShowMemoriesPanel(true)}
            onOpenQuiz={openQuizExperience}
            onOpenSpin={openSpinMatch}
            onOpenFavorites={() => setShowFavorites(true)}
          />
        </React.Suspense>

        <div className="app-shell__canvas app-shell__canvas--main">
          <div className="app-workspace-stack">
            <AppHeader
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            <React.Suspense
              fallback={<WorkspaceShellFallback activeTab={activeTab} isMobile={isMobile} />}
            >
              <AppWorkspaceShell
                isMobile={isMobile}
                activeTab={activeTab}
                onOpenQuiz={openQuizExperience}
                onOpenSpin={openSpinMatch}
                onOpenSpinOnly={openSpinWheelOnly}
              />
            </React.Suspense>
          </div>
        </div>

        {featureModals.map((modal) => (
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
            <div style={modal.contentStyle ?? modalBodyStyle}>
              {modal.isOpen ? modal.content : null}
            </div>
          </MinigameModal>
        ))}

      </div>
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
