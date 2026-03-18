import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RetroEffects from '@/components/effects/RetroEffects';
import TabTransition from '@/components/effects/TabTransition';
import { useQuiz } from '@/hooks/useQuiz';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { UserProvider, useToast, useUser, ThemeProvider, ToastProvider } from '@/context';
import type { MainTab } from '@/types';
import BottomSheet from '@/ui/BottomSheet';
import MinigameModal from '@/ui/MinigameModal';
import UserSelection from '@/components/common/UserSelection';
import FoodMergeGame from '@/components/food-merge/FoodMergeGame';
import SpinWheelGame from '@/components/SpinWheelGame';
import FloatingMemoriesPanel from '@/components/memories/FloatingMemoriesPanel';
import Matchmaker from '@/components/matchmaker/Matchmaker';
import PlacesList from '@/components/places/PlacesList';
import QuizEditor from '@/components/quiz/QuizEditor';
import QuizFlow from '@/components/quiz/QuizFlow';
import Watchlist from '@/components/watchlist';
import ThemeToggle from '@/ui/ThemeToggle';
import ActionBubble from '@/ui/ActionBubble';
import CommandDeck, { type CommandActionItem } from '@/ui/CommandDeck';
import { useAudio } from '@/hooks/useAudio';
import { colors, spacing, typography, zIndex, motion, shadows, radius } from '@/design-system';
import './App.css';

interface MainTabItem {
  id: MainTab;
  label: string;
  icon: string;
}

interface BuildCommandDeckArgs {
  currentUser: string | null;
  quizCompleted: boolean;
  openQuizExperience: () => void;
  openMatchmaker: () => void;
  openMemories: () => void;
  openSpinWheel: () => void;
  openFoodMerge: () => void;
  crtEnabled: boolean;
  toggleCrt: () => void;
  cursorTrailEnabled: boolean;
  toggleCursorTrail: () => void;
}

interface ActionBubblePosition {
  x: number;
  y: number;
}

const MAIN_TABS: MainTabItem[] = [
  { id: 'queue', label: 'Watchlist', icon: '🎬' },
  { id: 'places', label: 'Date Spots', icon: '📍' },
];

const ACTION_BUBLE_SIZE = 58;
const ACTION_BUBBLE_EDGE_MARGIN = 12;
const ACTION_BUBBLE_DRAG_THRESHOLD = 5;
const ACTION_BUBBLE_MENU_GUESS_HEIGHT = 262;
const ACTION_BUBBLE_MENU_WIDTH = 260;

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

const getActionBubbleMenuPosition = (bubblePosition: ActionBubblePosition) => {
  if (typeof window === 'undefined') {
    return { left: `${ACTION_BUBBLE_EDGE_MARGIN}px`, top: `${ACTION_BUBBLE_EDGE_MARGIN * 2 + ACTION_BUBLE_SIZE}px` };
  }

  const margin = ACTION_BUBBLE_EDGE_MARGIN;
  const preferredX = bubblePosition.x;
  const menuMaxX = Math.max(margin, window.innerWidth - ACTION_BUBBLE_MENU_WIDTH - margin);
  const x = Math.min(
    Math.max(preferredX - Math.floor((ACTION_BUBBLE_MENU_WIDTH - ACTION_BUBLE_SIZE) / 2), margin),
    menuMaxX
  );

  const spaceBelow = window.innerHeight - (bubblePosition.y + ACTION_BUBLE_SIZE);
  const canFitBelow = spaceBelow - 10 >= ACTION_BUBBLE_MENU_GUESS_HEIGHT;
  const menuY = canFitBelow
    ? bubblePosition.y + ACTION_BUBLE_SIZE + 10
    : bubblePosition.y - ACTION_BUBBLE_MENU_GUESS_HEIGHT - 10;

  const maxY = Math.max(
    margin,
    window.innerHeight - ACTION_BUBBLE_MENU_GUESS_HEIGHT - margin
  );

  return {
    left: `${x}px`,
    top: `${Math.min(Math.max(menuY, margin), maxY)}px`,
  };
};

const buildCommandDeck = ({
  currentUser,
  quizCompleted,
  openQuizExperience,
  openMatchmaker,
  openMemories,
  openSpinWheel,
  openFoodMerge,
  crtEnabled,
  toggleCrt,
  cursorTrailEnabled,
  toggleCursorTrail,
}: BuildCommandDeckArgs): CommandActionItem[] => [
  {
    label: currentUser ? (quizCompleted ? 'Retake Quiz' : 'Start Quiz') : 'Edit Quiz',
    icon: '🧠',
    action: openQuizExperience,
  },
  {
    label: 'Matchmaker',
    icon: '💘',
    action: openMatchmaker,
  },
  {
    label: 'Memories',
    icon: '📸',
    action: openMemories,
  },
  {
    label: 'Spin Wheel',
    icon: '🎰',
    action: openSpinWheel,
  },
  {
    label: 'Food Merge',
    icon: '🍔',
    action: openFoodMerge,
  },
  {
    label: crtEnabled ? 'Disable CRT' : 'Enable CRT',
    icon: crtEnabled ? '📺' : '📟',
    action: toggleCrt,
  },
  {
    label: cursorTrailEnabled ? 'Disable Trail' : 'Enable Trail',
    icon: cursorTrailEnabled ? '✨' : '💫',
    action: toggleCursorTrail,
  },
];

const AppInner: React.FC = () => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const { playSwitch } = useAudio();
  const { quizData } = useQuiz();
  const isMobile = useMediaQuery(mediaBreakpoints.sm);

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(
    () => localStorage.getItem('quizCompleted') === 'true'
  );
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showFoodMerge, setShowFoodMerge] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [showQuizFlow, setShowQuizFlow] = useState(false);
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showActionBubbleMenu, setShowActionBubbleMenu] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
  const mobileActionTimeoutRef = useRef<number | null>(null);
  const actionBubbleRef = useRef<HTMLButtonElement | null>(null);
  const actionBubbleMenuRef = useRef<HTMLDivElement | null>(null);
  const actionBubbleDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: ActionBubblePosition;
  } | null>(null);
  const didActionBubbleDragRef = useRef(false);
  const hasCustomActionBubblePositionRef = useRef(false);

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

  const openMoreSheet = useCallback(() => {
    setShowMoreSheet(true);
    setShowActionBubbleMenu(false);
  }, []);

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

  useEffect(() => {
    if (!showActionBubbleMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (actionBubbleMenuRef.current?.contains(target) || actionBubbleRef.current?.contains(target)) {
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

  const activeTabMeta = useMemo(
    () => MAIN_TABS.find((item) => item.id === activeTab) ?? MAIN_TABS[0],
    [activeTab]
  );

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

  const handleActionDeckSelect = (action: () => void) => {
    if (mobileActionTimeoutRef.current !== null) {
      window.clearTimeout(mobileActionTimeoutRef.current);
    }
    setShowMoreSheet(false);
    mobileActionTimeoutRef.current = window.setTimeout(() => {
      mobileActionTimeoutRef.current = null;
      action();
    }, 150);
  };

  const commandDeckItems = useMemo(
    () =>
      buildCommandDeck({
        currentUser,
        quizCompleted,
        openQuizExperience,
        openMatchmaker,
        openMemories: () => setShowMemories(true),
        openSpinWheel: () => setShowSpinWheel(true),
        openFoodMerge: () => setShowFoodMerge(true),
        crtEnabled,
        toggleCrt: () => setCrtEnabled((prev) => !prev),
        cursorTrailEnabled,
        toggleCursorTrail: () => setCursorTrailEnabled((prev) => !prev),
      }),
    [currentUser, openMatchmaker, openQuizExperience, quizCompleted, crtEnabled, cursorTrailEnabled]
  );

  const actionBubbleMenuStyle = useMemo(
    () => getActionBubbleMenuPosition(actionBubblePosition),
    [actionBubblePosition]
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
    setIsDraggingActionBubble(true);
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
    }

    if (!didActionBubbleDragRef.current) {
      return;
    }

    setActionBubblePosition((previous) =>
      clampActionBubblePosition(previous.x + deltaX, previous.y + deltaY)
    );
  };

  const handleActionBubbleDragEnd = () => {
    if (didActionBubbleDragRef.current) {
      hasCustomActionBubblePositionRef.current = true;
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
    if (didActionBubbleDragRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    setShowActionBubbleMenu((current) => !current);
  };

  const handleTabChange = (tab: MainTab) => {
    if (tab === activeTab) return;
    playSwitch();
    setActiveTab(tab);
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
    setShowQuizFlow(false);
  };

  return (
    <ThemeProvider activeTab={activeTab}>
      <TabTransition activeTab={activeTab} />
      <RetroEffects crtEnabled={crtEnabled} cursorTrailEnabled={cursorTrailEnabled} />
      <div className="app-shell bg-main" style={{ minHeight: '100vh', backgroundColor: colors.background }}>
        <a href="#main-content" className="skip-link" style={{ position: 'absolute', left: '-9999px' }}>
          Skip to content
        </a>

        <div className="app-frame" style={{ position: 'relative', minHeight: '100vh' }}>
          <div className="app-frame__profile-login" style={{ position: 'fixed', top: spacing.md, left: spacing.md, zIndex: zIndex.elevated }}>
            <button
              type="button"
              className={`app-frame__profile-chip${currentUser ? '' : ' app-frame__profile-chip--empty'}`}
              onClick={openMoreSheet}
              aria-label={
                currentUser
                  ? `Signed in as ${currentUser}. Tap to manage profile.`
                  : 'No profile selected. Tap to choose a profile.'
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.xs} ${spacing.md}`,
                background: colors.surface1,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: radius.full,
                color: colors.textPrimary,
                cursor: 'pointer',
                boxShadow: shadows.card,
                transition: `all ${motion.duration.button} ${motion.easing.ease}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface2;
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface1;
                e.currentTarget.style.borderColor = colors.borderSubtle;
              }}
            >
              <span className="app-frame__profile-chip__dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: currentUser ? colors.success : colors.textTertiary }} />
              {currentUser ? <span className="app-frame__profile-chip__name" style={{ ...typography.presets.eyebrow, textTransform: 'none' }}>{currentUser}</span> : <span style={typography.presets.micro}>Select Profile</span>}
            </button>
          </div>

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

          {showActionBubbleMenu && (
            <div 
              className="action-bubble-menu" 
              ref={actionBubbleMenuRef} 
              style={{
                ...actionBubbleMenuStyle,
                position: 'fixed',
                zIndex: zIndex.modal,
                width: ACTION_BUBBLE_MENU_WIDTH,
                maxHeight: ACTION_BUBBLE_MENU_GUESS_HEIGHT,
                padding: spacing.md,
                background: colors.surface3,
                borderRadius: radius.lg,
                border: `1px solid ${colors.borderSecondary}40`,
                boxShadow: shadows.floating,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                animation: `fade-in ${motion.duration.fast} ${motion.easing.easeOut}`,
              }}
            >
              <CommandDeck
                items={commandDeckItems}
                variant="compact"
                onItemSelect={(item) => {
                  setShowActionBubbleMenu(false);
                  handleActionDeckSelect(item.action);
                }}
              />
            </div>
          )}

          <main id="main-content" className="workspace-stage" tabIndex={-1} style={{ outline: 'none', padding: isMobile ? `0 0 80px 0` : 0 }}>
            {isMobile && (
              <section className="mobile-hero" aria-label="electron overview" style={{ padding: `${spacing['2xl']} ${spacing.md} ${spacing.xl}`, textAlign: 'center' }}>
                <div className="mobile-hero__content">
                  <UserSelection
                    variant="inline"
                    className="mobile-hero__selection"
                    onActionsClick={openMoreSheet}
                  />
                </div>
              </section>
            )}

            <section className="workspace-header" aria-label="Current workspace overview" style={{ padding: isMobile ? spacing.md : `${spacing.xl} ${spacing.xl} ${spacing.md}` }}>
              <div className="workspace-header__left">
                {isMobile ? (
                  <h2 className="workspace-header__title" aria-live="polite" style={{ ...typography.presets.titleMd, display: 'flex', alignItems: 'center', gap: spacing.sm, margin: 0 }}>
                    <span className="workspace-header__title-icon" aria-hidden="true">
                      {activeTabMeta.icon}
                    </span>
                    <span>{activeTabMeta.label}</span>
                  </h2>
                ) : null}
              </div>

              {!isMobile && (
                <div className="workspace-header__controls" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.md }}>
                  <ThemeToggle activeTab={activeTab} onChange={handleTabChange} compact />
                </div>
              )}
            </section>

            <div className="workspace-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: spacing.md, padding: isMobile ? 0 : `0 ${spacing.xl} ${spacing.xl}` }}>
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
                      {isActivePanel ? tab.id === 'queue' ? <Watchlist /> : <PlacesList /> : null}
                    </section>
                  );
                })}
              </section>

              {!isMobile && !showMoreSheet ? (
                <aside className="support-rail" aria-label="Workspace tools and actions">
                  <section className="support-card" style={{ padding: spacing.lg, background: colors.surface1, borderRadius: radius.card, border: `1px solid ${colors.borderSubtle}` }}>
                    <div className="support-card__head" style={{ ...typography.presets.eyebrow, color: colors.textSecondary, marginBottom: spacing.md }}>
                      <span>Quick Actions</span>
                    </div>
                    <CommandDeck
                      items={commandDeckItems}
                      onItemSelect={(item) => item.action()}
                    />
                  </section>
                </aside>
              ) : null}
            </div>
          </main>
        </div>

        {isMobile && (
          <nav className="mobile-bottom-nav" aria-label="Main navigation" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: zIndex.overlay, display: 'flex', background: colors.surface3, borderTop: `1px solid ${colors.borderSubtle}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {MAIN_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`mobile-bottom-nav__item${isActive ? ' is-active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs,
                    padding: spacing.sm,
                    background: 'none',
                    border: 'none',
                    color: isActive ? colors.accent : colors.textTertiary,
                    transition: `color ${motion.duration.fast} ${motion.easing.ease}`,
                  }}
                >
                  <span className="mobile-bottom-nav__icon" aria-hidden="true" style={{ fontSize: '1.25rem' }}>{tab.icon}</span>
                  <span className="mobile-bottom-nav__label" style={typography.presets.caption}>{tab.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="mobile-bottom-nav__item"
              onClick={openMoreSheet}
              aria-label="More options"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                padding: spacing.sm,
                background: 'none',
                border: 'none',
                color: colors.textTertiary,
              }}
            >
              <span className="mobile-bottom-nav__icon" aria-hidden="true" style={{ fontSize: '1.25rem' }}>⋯</span>
              <span className="mobile-bottom-nav__label" style={typography.presets.caption}>More</span>
            </button>
          </nav>
        )}

        <BottomSheet
          isOpen={showMoreSheet}
          onClose={() => setShowMoreSheet(false)}
          title="Profile & Settings"
        >
          <div className="more-sheet" style={{ padding: `0 ${spacing.sm}` }}>
            <UserSelection
              variant="panel"
              title="Who's steering?"
              subtitle="Swap profiles or manage your settings here."
              className="more-sheet__profile-panel"
              onUserSelected={() => setShowMoreSheet(false)}
            />

            <div className="more-sheet__section" style={{ marginTop: spacing.xl, paddingTop: spacing.xl, borderTop: `1px solid ${colors.borderSubtle}` }}>
              <p className="more-sheet__section-label" style={{ ...typography.presets.eyebrow, color: colors.textSecondary, marginBottom: spacing.md }}>Actions</p>
              <CommandDeck
                items={commandDeckItems}
                variant="compact"
                onItemSelect={(item) => handleActionDeckSelect(item.action)}
              />
            </div>
          </div>
        </BottomSheet>

        <MinigameModal
          isOpen={showQuizEditor}
          onClose={() => setShowQuizEditor(false)}
          title="Quiz Editor"
          ariaLabel="Quiz editor"
          maxWidth={1200}
          maxHeight={900}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <QuizEditor onClose={() => setShowQuizEditor(false)} />
          </div>
        </MinigameModal>

        <MinigameModal
          isOpen={showFoodMerge}
          onClose={() => setShowFoodMerge(false)}
          title="Food Merge"
          ariaLabel="Food merge game"
          maxWidth={620}
          maxHeight={780}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FoodMergeGame />
          </div>
        </MinigameModal>

        <MinigameModal
          isOpen={showSpinWheel}
          onClose={() => setShowSpinWheel(false)}
          title="Spin Wheel"
          ariaLabel="Spin wheel picker"
          maxWidth={680}
          maxHeight={860}
          closeDisabled={isSpinWheelLocked}
          closeDisabledLabel="Finish the current spin before closing the wheel."
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SpinWheelGame onSpinningChange={setIsSpinWheelLocked} />
          </div>
        </MinigameModal>

        <MinigameModal
          isOpen={showMemories}
          onClose={() => setShowMemories(false)}
          title="Memories"
          ariaLabel="Memories panel"
          maxWidth={760}
          maxHeight={860}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FloatingMemoriesPanel />
          </div>
        </MinigameModal>

        <MinigameModal
          isOpen={showQuizFlow}
          onClose={() => setShowQuizFlow(false)}
          title={quizCompleted ? 'Retake Quiz' : 'Start Quiz'}
          ariaLabel="Quiz experience"
          maxWidth={920}
          maxHeight={900}
        >
          <div style={{ flex: 1, overflowY: 'auto', padding: spacing.lg }}>
            {quizData && currentUser ? (
              <QuizFlow
                key={`${currentUser}-${quizCompleted ? 'completed' : 'fresh'}`}
                quizData={quizData}
                currentUser={currentUser}
                onComplete={handleQuizComplete}
                onEdit={() => {
                  setShowQuizFlow(false);
                  setShowQuizEditor(true);
                }}
                isCompleted={false}
              />
            ) : (
              <p style={{ margin: 0, color: colors.textSecondary }}>Pick a profile to take the quiz.</p>
            )}
          </div>
        </MinigameModal>

        <MinigameModal
          isOpen={showMatchmaker}
          onClose={() => setShowMatchmaker(false)}
          title="Matchmaker"
          ariaLabel="Movie matchmaker"
          maxWidth={920}
          maxHeight={900}
        >
          <div style={{ flex: 1, overflowY: 'auto', padding: spacing.lg }}>
            <Matchmaker currentUser={currentUser} />
          </div>
        </MinigameModal>
        
        <style>
          {`
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}
        </style>
      </div>
    </ThemeProvider>
  );
};

const App: React.FC = () => (
  <UserProvider>
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  </UserProvider>
);

export default App;

