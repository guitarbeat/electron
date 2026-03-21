import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FrameEffect from '@/components/effects/FrameEffect';
import LoadingSequence from '@/components/effects/LoadingSequence';
import Moire from '@/components/effects/Moire';
import RetroEffects from '@/components/effects/RetroEffects';
import { buildFeatureModals } from '@/app/buildMinigameModals';
import { getQuizLaunchState, getWorkspaceMeta } from '@/app/shellState';
import UserSelection from '@/components/common/UserSelection';
import PlacesList from '@/components/places/PlacesList';
import Watchlist from '@/components/watchlist';
import { ThemeProvider, ToastProvider, UserProvider, useToast, useUser } from '@/context';
import { colors, spacing, typography } from '@/design-system';
import { useAudio } from '@/hooks/useAudio';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useQuiz } from '@/hooks/useQuiz';
import type { MainTab } from '@/types';
import ActionBubble from '@/ui/ActionBubble';
import ActionFanMenu from '@/ui/ActionFanMenu';
import Button from '@/ui/Button';
import Card from '@/ui/Card';
import type { CommandActionItem } from '@/ui/CommandDeck';
import MinigameModal from '@/ui/MinigameModal';
import ThemeToggle from '@/ui/ThemeToggle';
import './App.css';

interface ActionBubblePosition {
  x: number;
  y: number;
}

const ACTION_BUBBLE_SIZE = 64;
const ACTION_BUBBLE_EDGE_MARGIN = 12;
const ACTION_BUBBLE_DRAG_THRESHOLD = 16;

const clampActionBubblePosition = (x: number, y: number): ActionBubblePosition => {
  if (typeof window === 'undefined') {
    return { x, y };
  }

  const maxX = Math.max(
    ACTION_BUBBLE_EDGE_MARGIN,
    window.innerWidth - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
  );
  const maxY = Math.max(
    ACTION_BUBBLE_EDGE_MARGIN,
    window.innerHeight - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
  );

  return {
    x: Math.min(Math.max(x, ACTION_BUBBLE_EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, ACTION_BUBBLE_EDGE_MARGIN), maxY),
  };
};

const snapActionBubbleToEdge = (position: ActionBubblePosition): ActionBubblePosition => {
  if (typeof window === 'undefined') {
    return position;
  }

  const midX = window.innerWidth / 2;
  const snappedX =
    position.x + ACTION_BUBBLE_SIZE / 2 < midX
      ? ACTION_BUBBLE_EDGE_MARGIN
      : window.innerWidth - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN;

  return clampActionBubblePosition(snappedX, position.y);
};

const getDefaultActionBubblePosition = (isMobile: boolean): ActionBubblePosition => {
  if (typeof window === 'undefined') {
    return { x: ACTION_BUBBLE_EDGE_MARGIN, y: ACTION_BUBBLE_EDGE_MARGIN };
  }

  const defaultX = isMobile
    ? window.innerWidth - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
    : ACTION_BUBBLE_EDGE_MARGIN + 6;
  const defaultY = window.innerHeight - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN - 6;

  return clampActionBubblePosition(defaultX, defaultY);
};

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
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
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [showActionFanMenu, setShowActionFanMenu] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
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
  const [actionBubblePosition, setActionBubblePosition] = useState<ActionBubblePosition>(() =>
    getDefaultActionBubblePosition(isMobile)
  );
  const [isDraggingActionBubble, setIsDraggingActionBubble] = useState(false);

  const actionBubbleDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: ActionBubblePosition;
  } | null>(null);
  const didActionBubbleDragRef = useRef(false);
  const suppressActionBubbleClickRef = useRef(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', activeTab === 'places' ? 'places' : 'movies');
  }, [activeTab]);

  useEffect(() => {
    const handleDragResize = () => {
      setActionBubblePosition((previous) => clampActionBubblePosition(previous.x, previous.y));
    };

    window.addEventListener('resize', handleDragResize);
    return () => {
      window.removeEventListener('resize', handleDragResize);
    };
  }, []);

  const openQuizExperience = useCallback(() => {
    if (currentUser) {
      setShowQuizFlow(true);
      return;
    }

    setShowQuizEditor(true);
  }, [currentUser]);

  const openMatchmaker = useCallback(() => {
    if (!currentUser) {
      showToast({
        message: 'Pick Aaron or Electra before starting Matchmaker.',
        type: 'info',
      });
      return;
    }

    setShowMatchmaker(true);
  }, [currentUser, showToast]);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      if (tab === activeTab) {
        return;
      }

      playSwitch();
      setShowActionFanMenu(false);
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
        showQuizEditor,
        showQuizFlow,
        showSpinWheel,
        showMatchmaker,
        quizCompleted,
        isSpinWheelLocked,
        quizData,
        currentUser,
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
      quizData,
      showMatchmaker,
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
      (Math.abs(deltaX) > ACTION_BUBBLE_DRAG_THRESHOLD || Math.abs(deltaY) > ACTION_BUBBLE_DRAG_THRESHOLD)
    ) {
      didActionBubbleDragRef.current = true;
      setIsDraggingActionBubble(true);
    }

    if (!didActionBubbleDragRef.current) {
      return;
    }

    setActionBubblePosition(() =>
      clampActionBubblePosition(dragState.origin.x + deltaX, dragState.origin.y + deltaY)
    );
  };

  const handleActionBubbleDragEnd = () => {
    if (didActionBubbleDragRef.current) {
      suppressActionBubbleClickRef.current = true;
      setActionBubblePosition((previous) => snapActionBubbleToEdge(previous));
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

    setShowActionFanMenu((isOpen) => !isOpen);
  };

  const quizLaunch = getQuizLaunchState({ currentUser, quizCompleted, quizData });
  const workspaceMeta = getWorkspaceMeta(activeTab);
  const shouldShowLoadingSequence = showLoadingSequence && !prefersReducedMotion;
  const isMoireVisible = !showLoadingSequence && !prefersReducedMotion;
  const quizFacts = [
    currentUser ? `${currentUser} active` : 'Guest mode',
    `${quizData?.questions.length ?? 0} prompts`,
    quizCompleted ? 'Retake ready' : currentUser ? 'Fresh run' : 'Editor access',
  ];

  const actionFanItems = useMemo(
    (): CommandActionItem[] => [
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

  return (
    <ThemeProvider activeTab={activeTab}>
      {shouldShowLoadingSequence && <LoadingSequence onComplete={() => setShowLoadingSequence(false)} />}
      <RetroEffects crtEnabled={crtEnabled} cursorTrailEnabled={cursorTrailEnabled} />
      <FrameEffect>
        <div className="app-shell bg-main" style={{ minHeight: '100vh', backgroundColor: colors.background }}>
          {!prefersReducedMotion && <Moire isVisible={isMoireVisible} />}
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>

          <div className="app-frame" style={{ position: 'relative', minHeight: '100vh' }}>
            <ActionBubble
              currentUser={currentUser}
              position={actionBubblePosition}
              isDragging={isDraggingActionBubble}
              onClick={handleActionBubbleClick}
              onPointerDown={handleActionBubblePointerDown}
              onPointerMove={handleActionBubblePointerMove}
              onPointerUp={finishActionBubbleDrag}
              onPointerCancel={finishActionBubbleDrag}
            />

            {showActionFanMenu && (
              <ActionFanMenu
                items={actionFanItems}
                anchorX={actionBubblePosition.x}
                anchorY={actionBubblePosition.y}
                anchorSize={ACTION_BUBBLE_SIZE}
                onItemSelect={(item) => {
                  item.action();
                }}
                onClose={() => setShowActionFanMenu(false)}
              />
            )}

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
                {activeTab === 'queue' ? <Watchlist isMobile={isMobile} /> : <PlacesList isMobile={isMobile} />}
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
