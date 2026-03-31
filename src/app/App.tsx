import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildFeatureModals } from '@/app/buildMinigameModals';
import { getRequestedLogoVariant, isLogoLabEnabled } from '@/app/logoLab';
import { ThemeProvider, ToastProvider, UserProvider, useUser } from '@/app/providers';
import ShellControlStrip from '@/app/ShellControlStrip';
import { type ShellActionId } from '@/app/shellState';
const MagicComponent = React.lazy(() => import('@/components/effects/Moire/Moire'));
import RetroEffects from '@/components/effects/RetroEffects';
import VignetteOverlay from '@/components/effects/VignetteOverlay';
import ElectronLogoLab from '@/branding/ElectronLogoLab';
import { useAudio } from '@/hooks/useAudio';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { MainTab } from '@/shared/types';
import MinigameModal from '@/ui/MinigameModal';
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

  const openQuizExperience = useCallback(() => {
    if (currentUser) {
      setShowQuizFlow(true);
      return;
    }

    setShowQuizEditor(true);
  }, [currentUser]);

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

  const handleShellAction = useCallback(
    (action: ShellActionId) => {
      switch (action) {
        case 'messages':
          setShowMessages(true);
          return;
        case 'notes':
          setShowMemoriesPanel(true);
          return;
        case 'quiz':
          openQuizExperience();
          return;
        case 'spin-match':
          setShowSpinWheel(true);
          return;
        default:
          action satisfies never;
      }
    },
    [openQuizExperience]
  );

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
        <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
        <div className="app-shell app-shell--viewport bg-main">
          <React.Suspense fallback={null}>
            {!prefersReducedMotion ? <MagicComponent isVisible /> : null}
          </React.Suspense>
          <VignetteOverlay />
          <ElectronLogoLab initialVariant={logoLabState.initialVariant} />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider activeTab={activeTab}>
      <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
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

        <div className="app-shell__canvas app-shell__canvas--main">
          <div className="app-workspace-stack">
            <div className="workspace-unified-card">
              <ShellControlStrip
                activeTab={activeTab}
                currentUser={currentUser}
                quizCompleted={quizCompleted}
                onAction={handleShellAction}
                onTabChange={handleTabChange}
              />
              <React.Suspense fallback={null}>
                <AppWorkspaceShell
                  isMobile={isMobile}
                  activeTab={activeTab}
                  currentUser={currentUser}
                />
              </React.Suspense>
            </div>
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
