import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FrameEffect from '@/components/effects/FrameEffect';
import LoadingSequence from '@/components/effects/LoadingSequence';
import Moire from '@/components/effects/Moire';
import RetroEffects from '@/components/effects/RetroEffects';
import { useQuiz } from '@/hooks/useQuiz';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { UserProvider, useToast, useUser, ThemeProvider, ToastProvider } from '@/context';
import type { MainTab } from '@/types';
import { buildMinigameModals } from '@/app/buildMinigameModals';
import BottomSheet from '@/ui/BottomSheet';
import MinigameModal from '@/ui/MinigameModal';
import UserSelection from '@/components/common/UserSelection';
import SpinWheelGame from '@/components/SpinWheelGame';
import FloatingMemoriesPanel from '@/components/memories/FloatingMemoriesPanel';
import Matchmaker from '@/components/matchmaker/Matchmaker';
import PlacesList from '@/components/places/PlacesList';
import Watchlist from '@/components/watchlist';
import ActionBubble from '@/ui/ActionBubble';
import ActionFanMenu from '@/ui/ActionFanMenu';
import CommandDeck, { type CommandActionItem } from '@/ui/CommandDeck';
import { useAudio } from '@/hooks/useAudio';
import { colors, spacing, typography } from '@/design-system';
import { executeAction } from '@/utils';
import './App.css';

interface MainTabItem {
  id: MainTab;
  label: string;
}

interface ActionBubblePosition {
  x: number;
  y: number;
}

const MAIN_TABS: MainTabItem[] = [
  { id: 'queue', label: 'Watchlist' },
  { id: 'places', label: 'Date Spots' },
];

const ACTION_BUBLE_SIZE = 64;
const ACTION_BUBBLE_EDGE_MARGIN = 12;
const ACTION_BUBBLE_DRAG_THRESHOLD = 16;

const clampActionBubblePosition = (x: number, y: number): ActionBubblePosition => {
  if (typeof window === 'undefined') {
    return { x, y };
  }

  const maxX = Math.max(
    ACTION_BUBBLE_EDGE_MARGIN,
    window.innerWidth - ACTION_BUBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
  );
  const maxY = Math.max(
    ACTION_BUBBLE_EDGE_MARGIN,
    window.innerHeight - ACTION_BUBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
  );

  return {
    x: Math.min(Math.max(x, ACTION_BUBBLE_EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, ACTION_BUBBLE_EDGE_MARGIN), maxY),
  };
};

const snapActionBubbleToEdge = (position: ActionBubblePosition): ActionBubblePosition => {
  if (typeof window === 'undefined') return position;
  const midX = window.innerWidth / 2;
  const snappedX =
    position.x + ACTION_BUBLE_SIZE / 2 < midX
      ? ACTION_BUBBLE_EDGE_MARGIN
      : window.innerWidth - ACTION_BUBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN;
  return clampActionBubblePosition(snappedX, position.y);
};

const getDefaultActionBubblePosition = (isMobile: boolean): ActionBubblePosition => {
  if (typeof window === 'undefined') {
    return { x: ACTION_BUBBLE_EDGE_MARGIN, y: ACTION_BUBBLE_EDGE_MARGIN };
  }

  const defaultX = isMobile
    ? window.innerWidth - ACTION_BUBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
    : ACTION_BUBBLE_EDGE_MARGIN + 6;
  const defaultY = window.innerHeight - ACTION_BUBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN - 6;

  return clampActionBubblePosition(defaultX, defaultY);
};

const App: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
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
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [showQuizFlow, setShowQuizFlow] = useState(false);
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showActionFanMenu, setShowActionFanMenu] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
  const [showLoadingSequence, setShowLoadingSequence] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [isMoireVisible, setIsMoireVisible] = useState(false);
  const mobileActionTimeoutRef = useRef<number | null>(null);
  const actionBubbleRef = useRef<HTMLButtonElement | null>(null);
  const actionBubbleDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: ActionBubblePosition;
  } | null>(null);
  const didActionBubbleDragRef = useRef(false);
  const suppressActionBubbleClickRef = useRef(false);

  const [actionBubblePosition, setActionBubblePosition] = useState<ActionBubblePosition>(() =>
    getDefaultActionBubblePosition(isMobile)
  );
  const [isDraggingActionBubble, setIsDraggingActionBubble] = useState(false);

  const [crtEnabled, setCrtEnabled] = useState<boolean>(
    () => localStorage.getItem('crtEnabled') === 'true'
  );
  const [cursorTrailEnabled, setCursorTrailEnabled] = useState<boolean>(
    () => localStorage.getItem('cursorTrailEnabled') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('crtEnabled', String(crtEnabled));
  }, [crtEnabled]);

  useEffect(() => {
    localStorage.setItem('cursorTrailEnabled', String(cursorTrailEnabled));
  }, [cursorTrailEnabled]);

  useEffect(() => {
    document.body.setAttribute('data-theme', activeTab === 'places' ? 'places' : 'movies');
  }, [activeTab]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setShowLoadingSequence(false);
      setIsMoireVisible(false);
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!prefersReducedMotion && !showLoadingSequence && !isMoireVisible) {
      setIsMoireVisible(true);
    }
  }, [isMoireVisible, prefersReducedMotion, showLoadingSequence]);

  const openMoreSheet = useCallback(() => {
    // On mobile, show ActionFanMenu instead of BottomSheet
    if (isMobile) {
      setShowActionFanMenu(true);
    } else {
      setShowMoreSheet(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (showMoreSheet && mobileActionTimeoutRef.current !== null) {
      window.clearTimeout(mobileActionTimeoutRef.current);
      mobileActionTimeoutRef.current = null;
    }
  }, [showMoreSheet]);

  useEffect(() => {
    return () => {
      if (mobileActionTimeoutRef.current !== null) {
        window.clearTimeout(mobileActionTimeoutRef.current);
      }
    };
  }, []);


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

  const runDelayedCommandAction = useCallback((action: () => void) => {
    if (mobileActionTimeoutRef.current !== null) {
      window.clearTimeout(mobileActionTimeoutRef.current);
    }
    setShowMoreSheet(false);
    mobileActionTimeoutRef.current = window.setTimeout(() => {
      mobileActionTimeoutRef.current = null;
      executeAction(action);
    }, 150);
  }, []);


  const handleDelayedDeckItemSelect = useCallback(
    (item: CommandActionItem) => {
      runDelayedCommandAction(item.action);
    },
    [runDelayedCommandAction]
  );

  const commandDeckItems = useMemo(
    (): CommandActionItem[] => [
      {
        label: currentUser ? 'Switch to Aaron' : 'Login as Aaron',
        icon: '👤',
        action: () => {
          if (currentUser !== 'Aaron') {
            // Simple login without PIN for demo purposes
            // In production, this would trigger PIN verification if Aaron has PIN
            setCurrentUser('Aaron');
          }
        },
      },
      {
        label: currentUser ? 'Switch to Electra' : 'Login as Electra', 
        icon: '👩',
        action: () => {
          if (currentUser !== 'Electra') {
            // Simple login without PIN for demo purposes
            // In production, this would trigger PIN verification if Electra has PIN
            setCurrentUser('Electra');
          }
        },
      },
      currentUser && {
        label: 'Logout',
        icon: '🚪',
        action: () => setCurrentUser(null),
      },
      {
        label: currentUser ? (quizCompleted ? 'Retake Quiz' : 'Start Quiz') : 'Edit Quiz',
        icon: '🧠',
        action: openQuizExperience,
      },
      { label: 'Matchmaker', icon: '💘', action: openMatchmaker },
      { label: 'Memories', icon: '📸', action: () => setShowMemories(true) },
      { label: 'Spin Wheel', icon: '🎰', action: () => setShowSpinWheel(true) },
    ].filter(Boolean) as CommandActionItem[],
    [currentUser, openMatchmaker, openQuizExperience, quizCompleted]
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
      setActionBubblePosition((prev) => snapActionBubbleToEdge(prev));
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

    // Show the ActionFanMenu instead of the more sheet
    setShowActionFanMenu(true);
  };

  const handleTabChange = (tab: MainTab) => {
    if (tab === activeTab) return;
    playSwitch();
    setActiveTab(tab);
  };

  const handleQuizComplete = useCallback(() => {
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
    setShowQuizFlow(false);
  }, []);

  const minigameModals = useMemo(
    () =>
      buildMinigameModals({
        showQuizEditor,
        showSpinWheel,
        showMemories,
        showQuizFlow,
        showMatchmaker,
        quizCompleted,
        isSpinWheelLocked,
        quizData,
        currentUser,
        setShowQuizEditor,
        setShowSpinWheel,
        setShowMemories,
        setShowQuizFlow,
        setShowMatchmaker,
        setIsSpinWheelLocked,
        onQuizComplete: handleQuizComplete,
      }),
    [
      showQuizEditor,
      showSpinWheel,
      showMemories,
      showQuizFlow,
      showMatchmaker,
      quizCompleted,
      isSpinWheelLocked,
      quizData,
      currentUser,
      handleQuizComplete,
    ]
  );

  return (
    <ThemeProvider activeTab={activeTab}>
      {showLoadingSequence && (
        <LoadingSequence
          onReveal={() => setIsMoireVisible(true)}
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
            <ActionBubble
              ref={actionBubbleRef}
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
                items={commandDeckItems}
                anchorX={actionBubblePosition.x}
                anchorY={actionBubblePosition.y}
                anchorSize={ACTION_BUBLE_SIZE}
                onItemSelect={(item) => {
                  item.action();
                  setShowActionFanMenu(false);
                }}
                onClose={() => setShowActionFanMenu(false)}
              />
            )}

            <main id="main-content" className="workspace-stage" tabIndex={-1} style={{ outline: 'none' }}>
              {isMobile && (
                <section className="mobile-hero" aria-label="electron overview" style={{ padding: `${spacing['2xl']} ${spacing.md} ${spacing.xl}`, textAlign: 'center' }}>
                  <div className="mobile-hero__content">
                    <UserSelection
                      variant="inline"
                      className="mobile-hero__selection"
                    />
                  </div>
                </section>
              )}

              <div className="workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: spacing.md, padding: isMobile ? 0 : `0 ${spacing.xl} ${spacing.xl}` }}>
                <section className="workspace-surface" aria-label="Primary workspace" style={{ minWidth: 0 }}>
                  {MAIN_TABS.map((tab) => {
                    const isActivePanel = tab.id === activeTab;
                    return (
                      <section
                        key={tab.id}
                        id={`tabpanel-${tab.id}`}
                        role="tabpanel"
                        hidden={!isActivePanel}
                        className="tab-panel"
                        aria-label={`${tab.label} panel`}
                        style={{ display: isActivePanel ? 'block' : 'none' }}
                      >
                        {isActivePanel ? tab.id === 'queue' ? <Watchlist activeTab={activeTab} onTabChange={handleTabChange} isMobile={isMobile} /> : <PlacesList activeTab={activeTab} onTabChange={handleTabChange} isMobile={isMobile} /> : null}
                      </section>
                    );
                  })}
                </section>
              </div>
            </main>
          </div>

          <BottomSheet
            isOpen={showMoreSheet}
            onClose={() => setShowMoreSheet(false)}
            title="Profile & Settings"
          >
            <div className="more-sheet" style={{ padding: `0 ${spacing.sm}` }}>
              <UserSelection
                variant="panel"
                title="Who's steering?"
                subtitle="Pick your seat."
                className="more-sheet__profile-panel"
                onUserSelected={() => setShowMoreSheet(false)}
              />

              <div className="more-sheet__section" style={{ marginTop: spacing.xl, paddingTop: spacing.xl, borderTop: `1px solid ${colors.borderSubtle}` }}>
                <p className="more-sheet__section-label" style={{ ...typography.presets.eyebrow, color: colors.textSecondary, marginBottom: spacing.md }}>Actions</p>
                <CommandDeck
                  items={commandDeckItems}
                  variant="compact"
                  onItemSelect={handleDelayedDeckItemSelect}
                />
              </div>
            </div>
          </BottomSheet>

          {minigameModals.map((modal) => (
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
