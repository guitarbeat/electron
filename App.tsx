import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAudio } from './src/hooks';
import { useQuiz } from './src/hooks/useQuiz';
import { UserProvider, useToast, useUser } from './src/context';
import { ThemeProvider } from './src/context';
import type { MainTab } from './src/types';
import Watchlist from './src/components/watchlist';
import QuizEditor from './src/components/quiz/QuizEditor';
import QuizFlow from './src/components/quiz/QuizFlow';
import PlacesList from './src/components/places/PlacesList';
import Matchmaker from './src/components/matchmaker/Matchmaker';
import FoodMergeGame from './src/components/food-merge/FoodMergeGame';
import SpinWheelGame from './src/components/extras/SpinWheelGame';
import FloatingMemoriesPanel from './src/components/memories/FloatingMemoriesPanel';
import UserSelection from './src/components/common/UserSelection';
import SparkleTap from './src/components/effects/SparkleTap';
import MinigameModal from './src/components/ui/MinigameModal';
import BottomSheet from './src/components/ui/BottomSheet';
import { ToastProvider } from './src/context';
import { useMediaQuery, breakpoints } from './src/hooks';
import './App.css';

const MAIN_TABS: Array<{ id: MainTab; label: string; icon: string }> = [
  { id: 'queue', label: 'Movie Nights', icon: '🎬' },
  { id: 'places', label: 'Date Spots', icon: '📍' },
];

const AppInner: React.FC = () => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const { playSwitch } = useAudio();
  const { quizData } = useQuiz();
  const isMobile = useMediaQuery(breakpoints.sm);

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

  useEffect(() => {
    document.body.setAttribute('data-theme', activeTab === 'places' ? 'places' : 'movies');
  }, [activeTab]);

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
    () => [
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
        action: () => setShowMemories(true),
      },
      {
        label: 'Spin Wheel',
        icon: '🎰',
        action: () => setShowSpinWheel(true),
      },
      {
        label: 'Food Merge',
        icon: '🍔',
        action: () => setShowFoodMerge(true),
      },
    ],
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
    setShowMoreSheet(false);
    setTimeout(action, 150);
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

        <div className="app-shell__decor" aria-hidden="true">
          <div className="floating-hearts-y2k" />
          <div className="twinkle-stars twinkle-stars-offset" />
          <span className="app-shell__bubble app-shell__bubble--one">🫧</span>
          <span className="app-shell__bubble app-shell__bubble--two">🐾</span>
          <span className="app-shell__bubble app-shell__bubble--three">😺</span>
          <span className="app-shell__bubble app-shell__bubble--four">{activeTabMeta.icon}</span>
        </div>

        {isMobile ? <SparkleTap /> : null}

        <div className="app-frame">
          <aside className="control-rail" aria-label="Workspace navigation">
            <div className="control-rail__panel control-rail__panel--brand">
              <span className="control-rail__badge">Cat-powered chaos</span>
              <p className="control-rail__eyebrow">Aaron & Electra</p>
              <h1 className="control-rail__title">Weekend<br />Planner</h1>
              <p className="control-rail__lede">
                Floating bubbles, oddball avatars, and date-night plotting tools.
              </p>
            </div>

            <div className="control-rail__panel">
              <div className="control-rail__section-head">
                <span>User</span>
              </div>
              <UserSelection variant="inline" />
              <p className="control-rail__meta">
                {currentUser
                  ? `${currentUser} is currently driving the plan.`
                  : 'Pick a bubble to start causing trouble.'}
              </p>
            </div>
          </aside>

          <main id="main-content" className="workspace-stage" tabIndex={-1}>
            {isMobile && (
              <section className="mobile-hero" aria-label="Weekend planner overview">
                <div className="mobile-hero__bubbles" aria-hidden="true">
                  <span className="mobile-hero__bubble mobile-hero__bubble--a">{activeTabMeta.icon}</span>
                  <span className="mobile-hero__bubble mobile-hero__bubble--b">🫧</span>
                  <span className="mobile-hero__bubble mobile-hero__bubble--c">✨</span>
                </div>
                <div className="mobile-hero__content">
                  <p className="mobile-hero__eyebrow">Aaron & Electra HQ</p>
                  <h1 className="mobile-hero__title">Weekend Planner</h1>
                  <p className="mobile-hero__copy">{mobileHeroCopy}</p>

                  <UserSelection variant="inline" className="mobile-hero__selection" />

                  <div className="mobile-command-ribbon" role="group" aria-label="Quick actions">
                    {commandDeck.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="mobile-command-ribbon__item"
                        onClick={item.action}
                      >
                        <span className="mobile-command-ribbon__icon" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span className="mobile-command-ribbon__label">{item.label}</span>
                      </button>
                    ))}
                  </div>
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
                  <div className="support-card__head">
                    <span>Actions</span>
                  </div>
                  <div className="command-deck">
                    {commandDeck.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="command-deck__item"
                        onClick={item.action}
                      >
                        <span className="command-deck__icon" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span className="command-deck__label">{item.label}</span>
                      </button>
                    ))}
                  </div>
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
              <div className="more-sheet__actions">
                {commandDeck.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="more-sheet__action-btn"
                    onClick={() => handleMobileAction(item.action)}
                  >
                    <span className="more-sheet__action-icon" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
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
