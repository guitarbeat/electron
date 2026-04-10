import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageIcon } from '@/common/icons';
import { buildFeatureModals } from '@/app/buildMinigameModals';
import { getRequestedLogoVariant, isLogoLabEnabled } from '@/app/logoLab';
import { ThemeProvider, ToastProvider, UserProvider } from '@/app/providers';
import { useUser } from '@/app/useProviders';
import ShellControlStrip from '@/app/ShellControlStrip';
const MagicComponent = React.lazy(() => import('@/components/effects/Moire/Moire'));
const RetroEffects = React.lazy(() => import('@/components/effects/RetroEffects'));
import VignetteOverlay from '@/components/effects/VignetteOverlay';
const ElectronLogoLab = React.lazy(() => import('@/branding/ElectronLogoLab'));
import { useAudio } from '@/hooks/useAudio';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useMovies } from '@/hooks/movies/useMovies';
import type { MainTab } from '@/shared/types';
import MinigameModal from '@/ui/MinigameModal';
import type { ViewMode } from '@/app/AppWorkspaceShell';
import './App.scss';

const AppWorkspaceShell = React.lazy(() => import('@/app/AppWorkspaceShell'));

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(
    () => localStorage.getItem('quizCompleted') === 'true'
  );
  const [showMessages, setShowMessages] = useState(false);
  const [showMemoriesPanel, setShowMemoriesPanel] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizFlow, setShowQuizFlow] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [cursorTrailEnabled] = useState<boolean>(
    () => localStorage.getItem('cursorTrailEnabled') === 'true'
  );

  const { movies } = useMovies(currentUser, activeTab !== 'queue');

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

  const openQuizExperience = useCallback(() => {
    setShowQuizFlow(true);
  }, []);

  const handleQuizComplete = useCallback(() => {
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
    setShowQuizFlow(false);
  }, []);

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

  const featureModals = useMemo(
    () =>
      buildFeatureModals({
        showMessages,
        showMemoriesPanel,
        showQuizEditor,
        showQuizFlow,
        showSpinWheel,
        quizCompleted,
        isSpinWheelLocked,
        currentUser,
        setShowMessages,
        setShowMemoriesPanel,
        setShowQuizEditor,
        setShowQuizFlow,
        setShowSpinWheel,
        setIsSpinWheelLocked,
        onQuizComplete: handleQuizComplete,
      }),
    [
      currentUser,
      handleQuizComplete,
      isSpinWheelLocked,
      quizCompleted,
      showMemoriesPanel,
      showMessages,
      showQuizEditor,
      showQuizFlow,
      showSpinWheel,
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

  return (
    <ThemeProvider activeTab={activeTab}>
      <React.Suspense fallback={null}>
        <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
      </React.Suspense>
      <div className="app-shell app-shell--viewport bg-main">
        <React.Suspense fallback={null}>
          {!prefersReducedMotion ? (
            <MagicComponent isVisible opacity={0.2} />
          ) : null}
        </React.Suspense>
        <VignetteOverlay />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <button
          type="button"
          className="messages-fab"
          aria-label="Open messages"
          onClick={() => setShowMessages(true)}
        >
          <MessageIcon size={22} />
        </button>

        <div className="app-shell__canvas app-shell__canvas--main">
          <div className="app-workspace-stack">
            <ShellControlStrip
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            <React.Suspense fallback={null}>
              <AppWorkspaceShell
                isMobile={isMobile}
                activeTab={activeTab}
                onOpenQuiz={openQuizExperience}
                quizCompleted={quizCompleted}
                onOpenSpin={openSpinMatch}
                viewMode={viewMode}
                onSetViewMode={setViewMode}
                movies={movies}
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
            <div style={modal.contentStyle ?? { flex: 1, overflowY: 'auto' }}>
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
