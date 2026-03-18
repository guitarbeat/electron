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
  containerClassName: string;
  buttonClassName?: string;
  iconClassName: string;
  labelClassName?: string;
  containerRole?: 'group' | 'listbox';
  containerAriaLabel?: string;
  onItemSelect: (item: CommandActionItem) => void;
}

const MAIN_TABS: MainTabItem[] = [
  { id: 'queue', label: 'Movie Nights', icon: '🎬' },
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
  containerClassName,
  buttonClassName,
  iconClassName,
  labelClassName,
  containerRole,
  containerAriaLabel,
  onItemSelect,
}) => {
  return (
    <div className={containerClassName} role={containerRole} aria-label={containerAriaLabel}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={buttonClassName}
          onClick={() => onItemSelect(item)}
        >
          <span className={iconClassName} aria-hidden="true">
            {item.icon}
          </span>
          {labelClassName ? <span className={labelClassName}>{item.label}</span> : <span>{item.label}</span>}
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
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
  const mobileActionTimeoutRef = useRef<number | null>(null);

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

  const handleMobileAction = (action: () => void) => {
    if (mobileActionTimeoutRef.current !== null) {
      window.clearTimeout(mobileActionTimeoutRef.current);
    }
    setShowMoreSheet(false);
    mobileActionTimeoutRef.current = window.setTimeout(() => {
      mobileActionTimeoutRef.current = null;
      action();
    }, 150);
  };

  const mobileHeroCopy = currentUser
    ? `${currentUser} is steering the chaos. Tap a bubble to swap cats or hand off the controls.`
    : 'Pick a bubble, pull in a fresh cat avatar, and start plotting the weekend.';

  return (
    <ThemeProvider activeTab={activeTab}>
      <div className="app-shell bg-main">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>


          <div className="app-frame">
          <main id="main-content" className="workspace-stage" tabIndex={-1}>
            {isMobile && (
              <section className="mobile-hero" aria-label="Weekend planner overview">
                <div className="mobile-hero__content">
                  <h1 className="mobile-hero__title">Weekend Planner</h1>
                  <p className="mobile-hero__copy">{mobileHeroCopy}</p>

                  <UserSelection variant="inline" className="mobile-hero__selection" />

                  <CommandDeck
                    items={commandDeck}
                    containerClassName="mobile-command-ribbon"
                    buttonClassName="mobile-command-ribbon__item"
                    iconClassName="mobile-command-ribbon__icon"
                    labelClassName="mobile-command-ribbon__label"
                    containerRole="group"
                    containerAriaLabel="Quick actions"
                    onItemSelect={(item) => item.action()}
                  />
                </div>
              </section>
            )}

            <section className="workspace-header" aria-label="Current workspace overview">
              <div className="workspace-header__left">
                <h2 className="workspace-header__title" aria-live="polite">
                  <span className="workspace-header__title-icon" aria-hidden="true">
                    {activeTabMeta.icon}
                  </span>
                  <span>{activeTabMeta.label}</span>
                </h2>
                {isMobile && currentUser && (
                  <button
                    type="button"
                    className="mobile-user-chip"
                    onClick={() => setShowMoreSheet(true)}
                    aria-label={`Signed in as ${currentUser}. Tap for profile settings.`}
                  >
                    <span className="mobile-user-chip__dot" />
                    <span className="mobile-user-chip__name">{currentUser}</span>
                  </button>
                )}
                {isMobile && !currentUser && (
                  <button
                    type="button"
                    className="mobile-user-chip mobile-user-chip--empty"
                    onClick={() => setShowMoreSheet(true)}
                    aria-label="No user selected. Tap for profile settings."
                  >
                    <span className="mobile-user-chip__name">Pick user</span>
                  </button>
                )}
              </div>

              {!isMobile && (
                <div className="workspace-tabs" role="tablist" aria-label="Primary workspaces">
                  {MAIN_TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                      <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`tabpanel-${tab.id}`}
                        className={`workspace-tabs__button${isActive ? ' is-active' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
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
                      aria-labelledby={`tab-${tab.id}`}
                      hidden={!isActivePanel}
                      className="tab-panel"
                    >
                      {isActivePanel ? tab.id === 'queue' ? <Watchlist /> : <PlacesList /> : null}
                    </section>
                  );
                })}
              </section>

              <aside className="support-rail" aria-label="Workspace tools and actions">
                <section className="support-card">
                  <UserSelection variant="inline" />
                </section>

                <section className="support-card">
                  <div className="support-card__head">
                    <span>Actions</span>
                  </div>
                  <CommandDeck
                    items={commandDeck}
                    containerClassName="command-deck"
                    buttonClassName="command-deck__item"
                    iconClassName="command-deck__icon"
                    labelClassName="command-deck__label"
                    onItemSelect={(item) => item.action()}
                  />
                </section>
              </aside>
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
              activeTab={activeTab}
              title="Who's steering?"
              subtitle="Swap bubbles, refresh the cat pics, or lock down a profile before you dive back in."
              className="more-sheet__profile-panel"
              onUserSelected={() => setShowMoreSheet(false)}
              onTabChange={(tab) => {
                handleTabChange(tab);
                setShowMoreSheet(false);
              }}
            />

            <div className="more-sheet__section">
              <p className="more-sheet__section-label">Actions</p>
            <CommandDeck
              items={commandDeck}
              containerClassName="more-sheet__actions"
              buttonClassName="more-sheet__action-btn"
              iconClassName="more-sheet__action-icon"
              onItemSelect={(item) => handleMobileAction(item.action)}
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
