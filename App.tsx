import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import './App.css';

interface CommandActionItem {
  label: string;
  icon: string;
  action: () => void;
}

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
}

interface CommandDeckProps {
  items: readonly CommandActionItem[];
  variant?: 'default' | 'compact';
  onItemSelect: (item: CommandActionItem) => void;
}

interface ActionBubblePosition {
  x: number;
  y: number;
}

const MAIN_TABS: MainTabItem[] = [
  { id: 'queue', label: 'Watchlist', icon: '🎬' },
  { id: 'places', label: 'Date Spots', icon: '📍' },
];

const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
  }, []);

  const playTone = useCallback(
    (frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        } else {
          return;
        }
      }

      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    []
  );

  const playClick = useCallback(() => {
    playTone(800, 'sine', 0.05, 0.05);
  }, [playTone]);

  const playPop = useCallback(() => {
    playTone(400, 'sine', 0.1, 0.08);
  }, [playTone]);

  const playSwitch = useCallback(() => {
    playTone(600, 'triangle', 0.08, 0.04);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    playTone(523.25, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(659.25, 'sine', 0.2, 0.1), 100);
  }, [playTone]);

  return { playTone, playClick, playPop, playSwitch, playSuccess };
};

const ACTION_BUBBLE_SIZE = 58;
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

const getActionBubbleMenuPosition = (bubblePosition: ActionBubblePosition) => {
  if (typeof window === 'undefined') {
    return { left: `${ACTION_BUBBLE_EDGE_MARGIN}px`, top: `${ACTION_BUBBLE_EDGE_MARGIN * 2 + ACTION_BUBBLE_SIZE}px` };
  }

  const margin = ACTION_BUBBLE_EDGE_MARGIN;
  const preferredX = bubblePosition.x;
  const menuMaxX = Math.max(margin, window.innerWidth - ACTION_BUBBLE_MENU_WIDTH - margin);
  const x = Math.min(
    Math.max(preferredX - Math.floor((ACTION_BUBBLE_MENU_WIDTH - ACTION_BUBBLE_SIZE) / 2), margin),
    menuMaxX
  );

  const spaceBelow = window.innerHeight - (bubblePosition.y + ACTION_BUBBLE_SIZE);
  const canFitBelow = spaceBelow - 10 >= ACTION_BUBBLE_MENU_GUESS_HEIGHT;
  const menuY = canFitBelow
    ? bubblePosition.y + ACTION_BUBBLE_SIZE + 10
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
];

const CommandDeck: React.FC<CommandDeckProps> = ({
  items,
  variant = 'default',
  onItemSelect,
}) => {
  const containerClassName = variant === 'compact' ? 'command-deck command-deck--compact' : 'command-deck';

  return (
    <div className={containerClassName}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="command-deck__item"
          onClick={() => onItemSelect(item)}
        >
          <span className="command-deck__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="command-deck__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

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

  useEffect(() => {
    document.body.setAttribute('data-theme', activeTab === 'places' ? 'places' : 'movies');
  }, [activeTab]);

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
    if (showMoreSheet && showActionBubbleMenu) {
      setShowActionBubbleMenu(false);
    }
  }, [showMoreSheet]);

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

  const commandDeck = useMemo(
    () =>
      buildCommandDeck({
        currentUser,
        quizCompleted,
        openQuizExperience,
        openMatchmaker,
        openMemories: () => setShowMemories(true),
        openSpinWheel: () => setShowSpinWheel(true),
        openFoodMerge: () => setShowFoodMerge(true),
      }),
    [currentUser, openMatchmaker, openQuizExperience, quizCompleted]
  );

  const renderActionDeck = useCallback(
    (variant: CommandDeckProps['variant'] = 'default', closeSheet = false) => (
      <CommandDeck
        items={commandDeck}
        variant={variant}
        onItemSelect={(item) => {
          if (closeSheet) {
            handleActionDeckSelect(item.action);
          } else {
            item.action();
          }
        }}
      />
    ),
    [commandDeck, handleActionDeckSelect]
  );

  const actionBubbleMenuStyle = useMemo(
    () => getActionBubbleMenuPosition(actionBubblePosition),
    [actionBubblePosition]
  );

  const renderActionDeckForBubble = useCallback(
    (variant: CommandDeckProps['variant'] = 'compact') => (
      <CommandDeck
        items={commandDeck}
        variant={variant}
        onItemSelect={(item) => {
          setShowActionBubbleMenu(false);
          handleActionDeckSelect(item.action);
        }}
      />
    ),
    [commandDeck, handleActionDeckSelect]
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
    } catch (error) {
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
      <div className="app-shell bg-main">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <div className="app-frame">
          <div className="app-frame__profile-login">
            <button
              type="button"
              className={`app-frame__profile-chip${currentUser ? '' : ' app-frame__profile-chip--empty'}`}
              onClick={() => setShowMoreSheet(true)}
              aria-label={
                currentUser
                  ? `Signed in as ${currentUser}. Tap to manage profile.`
                  : 'No profile selected. Tap to choose a profile.'
              }
            >
              <span className="app-frame__profile-chip__dot" />
              {currentUser ? <span className="app-frame__profile-chip__name">{currentUser}</span> : null}
            </button>
          </div>

          <button
            ref={actionBubbleRef}
            type="button"
            className={`action-bubble${isDraggingActionBubble ? ' is-dragging' : ''}`}
            onClick={handleActionBubbleClick}
            onPointerDown={handleActionBubblePointerDown}
            onPointerMove={handleActionBubblePointerMove}
            onPointerUp={finishActionBubbleDrag}
            onPointerCancel={finishActionBubbleDrag}
            aria-label="Open quick actions"
            style={{
              top: `${actionBubblePosition.y}px`,
              left: `${actionBubblePosition.x}px`,
            }}
          >
            <span className="action-bubble__icon" aria-hidden="true">
              ⚡
            </span>
            <span className="sr-only">Actions</span>
          </button>
          {showActionBubbleMenu ? (
            <div className="action-bubble-menu" ref={actionBubbleMenuRef} style={actionBubbleMenuStyle}>
              {renderActionDeckForBubble('compact')}
            </div>
          ) : null}

          <main id="main-content" className="workspace-stage" tabIndex={-1}>
            {isMobile && (
              <section className="mobile-hero" aria-label="electron overview">
                <div className="mobile-hero__content">
                  <UserSelection variant="inline" className="mobile-hero__selection" />
                  {renderActionDeck('compact')}
                </div>
              </section>
            )}

            <section className="workspace-header" aria-label="Current workspace overview">
              <div className="workspace-header__left">
                {isMobile ? (
                  <h2 className="workspace-header__title" aria-live="polite">
                    <span className="workspace-header__title-icon" aria-hidden="true">
                      {activeTabMeta.icon}
                    </span>
                    <span>{activeTabMeta.label}</span>
                  </h2>
                ) : null}
              </div>

              {!isMobile && (
                <div className="workspace-header__controls">
                  <ThemeToggle activeTab={activeTab} onChange={handleTabChange} compact />
                </div>
              )}
            </section>

            <div className="workspace-grid">
              <section className="workspace-surface" aria-label="Primary workspace">
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
                    >
                      {isActivePanel ? tab.id === 'queue' ? <Watchlist /> : <PlacesList /> : null}
                    </section>
                  );
                })}
              </section>

              {!isMobile && !showMoreSheet ? (
                <aside className="support-rail" aria-label="Workspace tools and actions">
                  <section className="support-card">
                    <div className="support-card__head">
                      <span>Actions</span>
                    </div>
                    {renderActionDeck()}
                  </section>
                </aside>
              ) : null}
            </div>
          </main>
        </div>

        {isMobile && (
          <nav className="mobile-bottom-nav" aria-label="Main navigation">
            {MAIN_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`mobile-bottom-nav__item${isActive ? ' is-active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="mobile-bottom-nav__icon" aria-hidden="true">{tab.icon}</span>
                  <span className="mobile-bottom-nav__label">{tab.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="mobile-bottom-nav__item"
              onClick={() => setShowMoreSheet(true)}
              aria-label="More options"
            >
              <span className="mobile-bottom-nav__icon" aria-hidden="true">⋯</span>
              <span className="mobile-bottom-nav__label">More</span>
            </button>
          </nav>
        )}

        <BottomSheet
          isOpen={showMoreSheet}
          onClose={() => setShowMoreSheet(false)}
          title="Menu"
        >
          <div className="more-sheet">
            <UserSelection
              variant="panel"
              title="Who's steering?"
              subtitle="Swap bubbles, refresh the cat pics, or lock down a profile before you dive back in."
              className="more-sheet__profile-panel"
              onUserSelected={() => setShowMoreSheet(false)}
            />

            <div className="more-sheet__section">
              <p className="more-sheet__section-label">Actions</p>
              {renderActionDeck('compact', true)}
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
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
              <p style={{ margin: 0 }}>Pick a profile to take the quiz.</p>
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
            <Matchmaker currentUser={currentUser} />
          </div>
        </MinigameModal>
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
