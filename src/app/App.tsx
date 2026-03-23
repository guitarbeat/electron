import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoadingSequence from '@/components/effects/LoadingSequence';
import RetroEffects from '@/components/effects/RetroEffects';
import {
  ACTION_BUBBLE_DRAG_THRESHOLD,
  clampActionBubblePosition,
  getDockedActionBubblePosition,
  getActionBubbleMenuPosition,
  getActionBubbleTogglePosition,
  getDefaultActionBubblePosition,
  snapActionBubbleToEdge,
  type ActionBubblePosition,
} from '@/app/actionBubble';
import { buildFeatureModals } from '@/app/buildMinigameModals';
import { getRequestedLogoVariant, isLogoLabEnabled } from '@/app/logoLab';
import ElectronLogoLab from '@/branding/ElectronLogoLab';
import { ELECTRON_LOGO_MARK_PATH } from '@/branding/logoAssets';
import { getQuizLaunchState, getWorkspaceMeta } from '@/app/shellState';
import UserSelection from '@/components/common/UserSelection';
import PlacesList from '@/components/places/PlacesList';
import Watchlist from '@/components/watchlist';
import { ThemeProvider, ToastProvider, UserProvider, useAppSession, useUser } from '@/app/providers';
import { colors } from '@/theme/tokens';
import { useAudio } from '@/hooks/useAudio';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { MainTab } from '@/shared/types';
import CommandDeck, { type CommandActionItem } from '@/ui/CommandDeck';
import MinigameModal from '@/ui/MinigameModal';
import ThemeToggle from '@/ui/ThemeToggle';
import './App.scss';

const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { isSessionLoading } = useAppSession();
  const { playSwitch } = useAudio();
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(
    () => localStorage.getItem('quizCompleted') === 'true'
  );
  const [showMessages, setShowMessages] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizFlow, setShowQuizFlow] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [showActionBubbleMenu, setShowActionBubbleMenu] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
  const [showLoadingSequence, setShowLoadingSequence] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [cursorTrailEnabled] = useState<boolean>(
    () => localStorage.getItem('cursorTrailEnabled') === 'true'
  );
  const [actionBubblePosition, setActionBubblePosition] = useState<ActionBubblePosition>(() => {
    const viewport = getViewportSize();
    return getDefaultActionBubblePosition(viewport.width, viewport.height, isMobile);
  });
  const [isDraggingActionBubble, setIsDraggingActionBubble] = useState(false);
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

  const actionBubbleRef = useRef<HTMLButtonElement | null>(null);
  const actionBubbleMenuRef = useRef<HTMLDivElement | null>(null);
  const workspaceControlsRef = useRef<HTMLDivElement | null>(null);
  const actionBubbleDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: ActionBubblePosition;
  } | null>(null);
  const didActionBubbleDragRef = useRef(false);
  const suppressActionBubbleClickRef = useRef(false);
  const hasCustomActionBubblePositionRef = useRef(false);

  const getDefaultBubblePosition = useCallback(() => {
    const viewport = getViewportSize();
    if (isMobile || !workspaceControlsRef.current) {
      return getDefaultActionBubblePosition(viewport.width, viewport.height, isMobile);
    }

    const bounds = workspaceControlsRef.current.getBoundingClientRect();
    return getDockedActionBubblePosition(
      {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      },
      viewport.width,
      viewport.height
    );
  }, [isMobile]);

  useEffect(() => {
    document.body.setAttribute('data-theme', activeTab === 'places' ? 'places' : 'movies');
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      setActionBubblePosition((previous) => {
        if (!hasCustomActionBubblePositionRef.current) {
          return getDefaultBubblePosition();
        }

        const viewport = getViewportSize();
        return clampActionBubblePosition(previous.x, previous.y, viewport.width, viewport.height);
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getDefaultBubblePosition]);

  useEffect(() => {
    if (!showActionBubbleMenu) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (
        actionBubbleMenuRef.current?.contains(target) ||
        actionBubbleRef.current?.contains(target)
      ) {
        return;
      }

      setShowActionBubbleMenu(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
    };
  }, [showActionBubbleMenu]);

  const openQuizExperience = useCallback(() => {
    if (currentUser) {
      setShowQuizFlow(true);
      return;
    }

    setShowQuizEditor(true);
  }, [currentUser]);

  const openMatchmaker = useCallback(() => {
    setShowMatchmaker(true);
  }, []);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      if (tab === activeTab) {
        return;
      }

      playSwitch();
      setShowActionBubbleMenu(false);
      setActiveTab(tab);
    },
    [activeTab, playSwitch]
  );

  const handleQuizComplete = useCallback(() => {
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
    setShowQuizFlow(false);
  }, []);

  const featureModals = useMemo(
    () =>
      buildFeatureModals({
        showMessages,
        showQuizEditor,
        showQuizFlow,
        showSpinWheel,
        showMatchmaker,
        quizCompleted,
        isSpinWheelLocked,
        currentUser,
        setShowMessages,
        setShowQuizEditor,
        setShowQuizFlow,
        setShowSpinWheel,
        setShowMatchmaker,
        setIsSpinWheelLocked,
        onQuizComplete: handleQuizComplete,
      }),
    [
      currentUser,
      handleQuizComplete,
      isSpinWheelLocked,
      quizCompleted,
      showMatchmaker,
      showMessages,
      showQuizEditor,
      showQuizFlow,
      showSpinWheel,
    ]
  );

  const handleActionBubblePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    actionBubbleDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: actionBubblePosition,
    };
    didActionBubbleDragRef.current = false;
    suppressActionBubbleClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleActionBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = actionBubbleDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (
      !didActionBubbleDragRef.current &&
      (Math.abs(deltaX) > ACTION_BUBBLE_DRAG_THRESHOLD ||
        Math.abs(deltaY) > ACTION_BUBBLE_DRAG_THRESHOLD)
    ) {
      didActionBubbleDragRef.current = true;
      setIsDraggingActionBubble(true);
    }

    if (!didActionBubbleDragRef.current) {
      return;
    }

    const viewport = getViewportSize();
    setActionBubblePosition(
      clampActionBubblePosition(
        dragState.origin.x + deltaX,
        dragState.origin.y + deltaY,
        viewport.width,
        viewport.height
      )
    );
  };

  const handleActionBubbleDragEnd = () => {
    if (didActionBubbleDragRef.current) {
      const viewport = getViewportSize();
      suppressActionBubbleClickRef.current = true;
      hasCustomActionBubblePositionRef.current = true;
      setActionBubblePosition((previous) =>
        snapActionBubbleToEdge(previous, viewport.width, viewport.height)
      );
      setShowActionBubbleMenu(false);
    }

    setIsDraggingActionBubble(false);
    actionBubbleDragRef.current = null;
    didActionBubbleDragRef.current = false;
  };

  const finishActionBubbleDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = actionBubbleDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    handleActionBubbleDragEnd();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore capture errors from canceled pointer interactions.
    }
  };

  const handleActionBubbleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressActionBubbleClickRef.current) {
      suppressActionBubbleClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    setShowActionBubbleMenu((current) => !current);
  };

  const quizLaunch = getQuizLaunchState({ currentUser, quizCompleted });
  const workspaceMeta = getWorkspaceMeta(activeTab);
  const shouldShowLoadingSequence = showLoadingSequence && !prefersReducedMotion;
  const actionItems = useMemo(
    (): CommandActionItem[] => [
      {
        label: 'Messages',
        icon: '💬',
        action: () => setShowMessages(true),
      },
      {
        label: quizLaunch.label,
        icon: '🧠',
        action: openQuizExperience,
      },
      {
        label: 'Spin Wheel',
        icon: '🎰',
        action: () => setShowSpinWheel(true),
      },
      {
        label: 'Matchmaker',
        icon: '💘',
        action: openMatchmaker,
      },
    ],
    [openMatchmaker, openQuizExperience, quizLaunch.label]
  );
  const actionBubbleMenuStyle = useMemo(() => {
    const viewport = getViewportSize();
    return getActionBubbleMenuPosition(actionBubblePosition, viewport.width, viewport.height);
  }, [actionBubblePosition]);
  const actionBubbleToggleStyle = useMemo(() => {
    const viewport = getViewportSize();
    return getActionBubbleTogglePosition(actionBubblePosition, viewport.width, viewport.height, isMobile);
  }, [actionBubblePosition, isMobile]);


  if (logoLabState.enabled) {
    return (
      <ThemeProvider activeTab={activeTab}>
        <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
        <div className="app-shell bg-main" style={{ minHeight: '100vh', backgroundColor: colors.background }}>
          <ElectronLogoLab initialVariant={logoLabState.initialVariant} />
        </div>
      </ThemeProvider>
    );
  }

  if (isSessionLoading) {
    return (
      <main className="session-loading-screen" aria-live="polite" aria-busy="true">
        <div className="session-loading-screen__panel">
          <p className="session-loading-screen__eyebrow">Electron</p>
          <p className="session-loading-screen__title">Loading Session</p>
          <p className="session-loading-screen__subtitle">
            Warming up your watchlist and date ideas.
          </p>
          <div className="session-loading-screen__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider activeTab={activeTab}>
      {shouldShowLoadingSequence ? (
        <LoadingSequence onComplete={() => setShowLoadingSequence(false)} />
      ) : null}
      <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
      <div
        className="app-shell bg-main"
        style={{ minHeight: '100vh', backgroundColor: colors.background }}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

          <div className="app-frame" style={{ position: 'relative', minHeight: '100vh' }}>
            <button
              ref={actionBubbleRef}
              type="button"
              className={`action-bubble${isDraggingActionBubble ? ' is-dragging' : ''}`}
              onClick={handleActionBubbleClick}
              onPointerDown={handleActionBubblePointerDown}
              onPointerMove={handleActionBubblePointerMove}
              onPointerUp={finishActionBubbleDrag}
              onPointerCancel={finishActionBubbleDrag}
              aria-label="Open messages and extras"
              aria-haspopup="menu"
              aria-expanded={showActionBubbleMenu}
              aria-controls="action-bubble-menu"
              style={{
                top: `${actionBubblePosition.y}px`,
                left: `${actionBubblePosition.x}px`,
              }}
            >
              <span className="action-bubble__icon" aria-hidden="true">
                <img
                  src={ELECTRON_LOGO_MARK_PATH}
                  alt=""
                  className="action-bubble__icon-image action-bubble__mark"
                  draggable="false"
                />
              </span>
              <span className="sr-only">Messages and extras</span>
            </button>
            <div className="action-bubble-toggle" style={actionBubbleToggleStyle}>
              <ThemeToggle
                activeTab={activeTab}
                onChange={handleTabChange}
                compact={isMobile}
                className="action-bubble-toggle__control"
                label="Switch between Watchlist and Date Ideas"
              />
            </div>

            {showActionBubbleMenu ? (
              <div
                id="action-bubble-menu"
                ref={actionBubbleMenuRef}
                className="action-bubble-menu"
                style={actionBubbleMenuStyle}
              >
                <CommandDeck
                  items={actionItems}
                  variant="compact"
                  onItemSelect={(item) => {
                    setShowActionBubbleMenu(false);
                    item.action();
                  }}
                />
              </div>
            ) : null}

            <main
              id="main-content"
              className="workspace-stage workspace-stage--simplified"
              tabIndex={-1}
            >
              <section className="duo-status-shell" aria-label="Profiles and app summary">
                <div className="duo-status-shell__grid">
                  <UserSelection
                    variant="panel"
                    title="Choose a profile"
                    className="duo-status-shell__selection"
                  />
                </div>
              </section>

              <section
                className="workspace-header workspace-header--simplified"
                aria-label="Workspace controls"
              >
                <p className="workspace-header__brandline">
                  <span className="workspace-header__brand-mark-shell" aria-hidden="true">
                    <img
                      src={ELECTRON_LOGO_MARK_PATH}
                      alt=""
                      className="workspace-header__brand-mark"
                      draggable="false"
                    />
                  </span>
                  <span className="workspace-header__brand-text">Electron</span>
                </p>
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
                <div
                  ref={workspaceControlsRef}
                  className="workspace-header__controls workspace-header__controls--toggle"
                />
              </section>

              <section
                className="workspace-surface"
                aria-label="Primary workspace"
                style={{ minWidth: 0 }}
              >
	                {activeTab === 'queue' ? (
	                  <Watchlist isMobile={isMobile} />
	                ) : (
	                  <PlacesList />
	                )}
              </section>
            </main>
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
            <div style={modal.contentStyle ?? { flex: 1, overflowY: 'auto' }}>{modal.content}</div>
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
