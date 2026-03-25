import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ActionBubbleLayer from '@/app/ActionBubbleLayer';
import AppWorkspaceShell from '@/app/AppWorkspaceShell';
import {
  ACTION_BUBBLE_DRAG_THRESHOLD,
  clampActionBubblePosition,
  getDockedActionBubblePosition,
  getActionBubbleMenuPosition,
  getDefaultActionBubblePosition,
  snapActionBubbleToEdge,
  type ActionBubblePosition,
} from '@/app/actionBubble';
import { buildFeatureModals } from '@/app/buildMinigameModals';
import { getRequestedLogoVariant, isLogoLabEnabled } from '@/app/logoLab';
import { getQuizLaunchState, getWorkspaceMeta } from '@/app/shellState';
import MagicComponent from '@/components/effects/Moire/Moire';
import RetroEffects from '@/components/effects/RetroEffects';
import VignetteOverlay from '@/components/effects/VignetteOverlay';
import ElectronLogoLab from '@/branding/ElectronLogoLab';
import { ThemeProvider, ToastProvider, UserProvider, useUser } from '@/app/providers';
import { useAudio } from '@/hooks/useAudio';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { MainTab } from '@/shared/types';
import type { CommandActionItem } from '@/ui/CommandDeck';
import MinigameModal from '@/ui/MinigameModal';
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
  const [showActionBubbleMenu, setShowActionBubbleMenu] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
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
        return clampActionBubblePosition(previous.x, previous.y, viewport.width, viewport.height, isMobile);
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getDefaultBubblePosition, isMobile]);

  useEffect(() => {
    if (!showActionBubbleMenu || isMobile) {
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
  }, [isMobile, showActionBubbleMenu]);

  const openQuizExperience = useCallback(() => {
    if (currentUser) {
      setShowQuizFlow(true);
      return;
    }

    setShowQuizEditor(true);
  }, [currentUser]);

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
        quizCompleted,
        isSpinWheelLocked,
        currentUser,
        setShowMessages,
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
        viewport.height,
        isMobile
      )
    );
  };

  const handleActionBubbleDragEnd = () => {
    if (didActionBubbleDragRef.current) {
      const viewport = getViewportSize();
      suppressActionBubbleClickRef.current = true;
      hasCustomActionBubblePositionRef.current = true;
      setActionBubblePosition((previous) =>
        snapActionBubbleToEdge(previous, viewport.width, viewport.height, isMobile)
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
  const isMoireVisible = !prefersReducedMotion;
  const actionItems = useMemo(
    (): CommandActionItem[] => [
      {
        label: 'Messages',
        icon: '💬',
        description: 'Chat with each other',
        action: () => setShowMessages(true),
      },
      {
        label: quizLaunch.label,
        icon: '🧠',
        description: 'Find your movie personality',
        action: openQuizExperience,
      },
      {
        label: 'Spin & Match',
        icon: '🎡',
        description: 'Decide what to watch together',
        action: () => setShowSpinWheel(true),
      },
    ],
    [openQuizExperience, quizLaunch.label]
  );
  const actionBubbleMenuStyle = useMemo(() => {
    const viewport = getViewportSize();
    return getActionBubbleMenuPosition(
      actionBubblePosition,
      viewport.width,
      viewport.height,
      isMobile
    );
  }, [actionBubblePosition, isMobile]);
  const workspaceMeta = useMemo(() => getWorkspaceMeta(activeTab), [activeTab]);

  if (logoLabState.enabled) {
    return (
      <ThemeProvider activeTab={activeTab}>
        <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
        <div className="app-shell app-shell--viewport bg-main">
          {!prefersReducedMotion ? <MagicComponent isVisible /> : null}
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
        {!prefersReducedMotion ? <MagicComponent isVisible={isMoireVisible} opacity={0.2} /> : null}
        <VignetteOverlay />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <div className="app-shell__canvas app-shell__canvas--main">
          <div className="app-floating-chrome">
            <ActionBubbleLayer
              actionBubbleRef={actionBubbleRef}
              actionBubbleMenuRef={actionBubbleMenuRef}
              actionBubblePosition={actionBubblePosition}
              isDraggingActionBubble={isDraggingActionBubble}
              actionBubbleMenuStyle={actionBubbleMenuStyle}
              isMobile={isMobile}
              activeTab={activeTab}
              showActionBubbleMenu={showActionBubbleMenu}
              onToggleMenu={setShowActionBubbleMenu}
              onTabChange={handleTabChange}
              actionItems={actionItems}
              onActionBubbleClick={handleActionBubbleClick}
              onActionBubblePointerDown={handleActionBubblePointerDown}
              onActionBubblePointerMove={handleActionBubblePointerMove}
              onFinishActionBubbleDrag={finishActionBubbleDrag}
            />
          </div>
          <div className="app-workspace-stack">
            <AppWorkspaceShell
              isMobile={isMobile}
              activeTab={activeTab}
              workspaceMeta={workspaceMeta}
              workspaceControlsRef={workspaceControlsRef}
            />
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
