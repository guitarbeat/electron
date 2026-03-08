import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from './src/hooks/useAudio';
import { useQuiz } from './src/hooks/useQuiz';
import { useUser } from './src/context/UserContext';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { MainTab } from './src/types';
import Watchlist from './src/components/watchlist';
import { BubbleDismissProvider } from './src/context/BubbleDismissContext';
import QuizEditor from './src/components/quiz/QuizEditor';
import QuizFlow from './src/components/quiz/QuizFlow';
import PlacesList from './src/components/places/PlacesList';
import Matchmaker from './src/components/matchmaker/Matchmaker';
import MinecraftBubble from './src/components/common/MinecraftBubble';
import DraggableFeatureBubble from './src/components/common/DraggableFeatureBubble';
import SnakeGame from './src/components/snake/SnakeGame';
import FoodDropGame from './src/components/extras/FoodDropGame';
import SpinWheelGame from './src/components/extras/SpinWheelGame';
import FloatingMemoriesPanel from './src/components/memories/FloatingMemoriesPanel';
import ChromaticDotField from './src/components/effects/ChromaticDotField';
import UserSelection from './src/components/common/UserSelection';
import MinigameModal from './src/components/ui/MinigameModal';
import { ToastProvider } from './src/context/ToastContext';
import './App.css';

const MAIN_TABS: {
  id: MainTab;
  label: string;
  icon: string;
  eyebrow: string;
  headline: string;
  description: string;
  detail: string;
}[] = [
  {
    id: 'queue',
    label: 'Movie Nights',
    icon: '01',
    eyebrow: 'Screening Room',
    headline: 'Plan the next watch night.',
    description:
      'Search, shortlist, review suggestions, and keep the watchlist in one place.',
    detail: 'Watchlist, suggestions, and progress.',
  },
  {
    id: 'places',
    label: 'Date Spots',
    icon: '02',
    eyebrow: 'City Atlas',
    headline: 'Plan the next outing.',
    description:
      'Map future spots, track visits, and keep place planning separate from the watchlist.',
    detail: 'Map, wishlist, and visited history.',
  },
];

const AppInner: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const { quizData } = useQuiz();

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showFoodDrop, setShowFoodDrop] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  useEffect(() => {
    const theme = activeTab === 'places' ? 'places' : 'movies';
    document.body.setAttribute('data-theme', theme);
  }, [activeTab]);

  const activeTabMeta = useMemo(() => MAIN_TABS.find((item) => item.id === activeTab), [activeTab]);
  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(new Date());
  }, []);

  const commandDeck = useMemo(
    () => [
      {
        label: quizCompleted ? 'Retune Quiz' : 'Run Quiz',
        description: quizCompleted
          ? 'Edit quiz settings.'
          : 'Start the quiz.',
        action: () => setShowQuizEditor(true),
      },
      {
        label: 'Memory Wall',
        description: 'Open shared memories.',
        action: () => setShowMemories(true),
      },
      {
        label: 'Spin Picker',
        description: 'Pick from the shortlist.',
        action: () => setShowSpinWheel(true),
      },
      {
        label: 'Food Drop',
        description: 'Open the extra game.',
        action: () => setShowFoodDrop(true),
      },
    ],
    [quizCompleted]
  );

  const signalCards = useMemo(
    () => [
      {
        label: 'Mode',
        value: activeTabMeta?.label ?? 'Movie Nights',
        note: activeTabMeta?.eyebrow ?? 'Screening Room',
      },
      {
        label: 'Pilot',
        value: currentUser ?? 'Choose a user',
        note: currentUser ? 'Active persona loaded' : 'Workspace not assigned',
      },
      {
        label: 'Quiz',
        value: quizCompleted ? 'Completed' : 'Pending',
        note: quizData ? 'Interactive layer ready' : 'No quiz data detected',
      },
    ],
    [activeTabMeta, currentUser, quizCompleted, quizData]
  );

  const handleTabChange = (tab: MainTab) => {
    if (tab !== activeTab) {
      playSwitch();
      setActiveTab(tab);
    }
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
  };

  return (
    <ThemeProvider activeTab={activeTab}>
      <div className="app-shell bg-main">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ChromaticDotField className="app-dot-background" density={0.72} mode="background" />

        <div className="app-frame">
          <aside className="control-rail" aria-label="Workspace navigation">
            <div className="control-rail__panel control-rail__brand">
              <p className="control-rail__eyebrow">Weekend OS</p>
              <h1 className="control-rail__title">Shared planning dashboard.</h1>
              <p className="control-rail__copy">Primary work stays centered. Tools stay secondary.</p>
            </div>

            <div className="control-rail__panel">
              <div className="control-rail__section-head">
                <span>Profiles</span>
                <span>{todayLabel}</span>
              </div>
              <UserSelection variant="inline" />
            </div>

            <section className="control-rail__panel signal-grid" aria-label="Workspace signals">
              {signalCards.map((card) => (
                <article key={card.label} className="signal-card">
                  <span className="signal-card__label">{card.label}</span>
                  <strong className="signal-card__value">{card.value}</strong>
                  <span className="signal-card__note">{card.note}</span>
                </article>
              ))}
            </section>
          </aside>

          <main id="main-content" className="workspace-stage" tabIndex={-1}>
            <section className="hero-board" aria-label="Current workspace overview">
              <div className="hero-board__content">
                <p className="hero-board__eyebrow">{activeTabMeta?.eyebrow}</p>
                <h2 className="hero-board__title" aria-live="polite">
                  <span key={activeTab} className="hero-board__title-word">
                    {activeTabMeta?.label}
                  </span>
                </h2>
                <div className="hero-mode-toggle" role="tablist" aria-label="Primary workspaces">
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
                        className={`hero-mode-toggle__button${isActive ? ' is-active' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                      >
                        <span className="hero-mode-toggle__index">{tab.icon}</span>
                        <span className="hero-mode-toggle__label">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="hero-board__kicker">{activeTabMeta?.headline}</p>
                <p className="hero-board__description">{activeTabMeta?.description}</p>

                <div className="hero-board__tags" aria-label="Workspace context">
                  <span className="hero-tag">Active mode: {activeTabMeta?.label}</span>
                  <span className="hero-tag">Date: {todayLabel}</span>
                  <span className="hero-tag">
                    Quiz: {quizCompleted ? 'calibrated' : 'needs setup'}
                  </span>
                </div>
              </div>

                <div className="hero-board__accent">
                <div className="accent-panel accent-panel--primary">
                  <span className="accent-panel__label">Primary</span>
                  <strong className="accent-panel__value">Focused workspace</strong>
                  <p className="accent-panel__copy">The main list or map stays in the center panel.</p>
                </div>
                <div className="accent-panel accent-panel--secondary">
                  <span className="accent-panel__label">Secondary</span>
                  <strong className="accent-panel__value">Tool dock</strong>
                  <p className="accent-panel__copy">Extra actions stay available without competing for space.</p>
                </div>
              </div>
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
                    <span>Command Deck</span>
                    <span>Fast actions</span>
                  </div>
                  <div className="command-deck">
                    {commandDeck.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="command-deck__item"
                        onClick={item.action}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="support-card">
                  <div className="support-card__head">
                    <span>Organization</span>
                    <span>Why this shell</span>
                  </div>
                  <div className="note-stack">
                    <article className="note-stack__item">
                      <strong>Primary stage</strong>
                      <p>The active list or map stays in the center.</p>
                    </article>
                    <article className="note-stack__item">
                      <strong>Separated tools</strong>
                      <p>Support actions live in the dock and side rail.</p>
                    </article>
                    <article className="note-stack__item">
                      <strong>Clear modes</strong>
                      <p>Each workspace keeps its own context.</p>
                    </article>
                  </div>
                </section>
              </aside>
            </div>
          </main>
        </div>

        <div className="tool-dock" aria-label="Quick launch tools">
          {commandDeck.map((item) => (
            <button key={item.label} type="button" className="tool-dock__button" onClick={item.action}>
              {item.label}
            </button>
          ))}
        </div>

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
          isOpen={showFoodDrop}
          onClose={() => setShowFoodDrop(false)}
          title="Food Drop"
          ariaLabel="Food drop game"
          maxWidth={620}
          maxHeight={780}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FoodDropGame />
          </div>
        </MinigameModal>

        <MinigameModal
          isOpen={showSpinWheel}
          onClose={() => setShowSpinWheel(false)}
          title="Spin Wheel"
          ariaLabel="Spin wheel picker"
          maxWidth={680}
          maxHeight={860}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SpinWheelGame />
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

        <div className="floating-bubbles">
          {quizData && currentUser ? (
            <QuizFlow
              quizData={quizData}
              currentUser={currentUser}
              onComplete={handleQuizComplete}
              onEdit={() => setShowQuizEditor(true)}
              isCompleted={quizCompleted}
            />
          ) : null}
          {currentUser ? <Matchmaker currentUser={currentUser} /> : null}
          <MinecraftBubble />
          <SnakeGame mode="floating" />
          <DraggableFeatureBubble
            title="Food Drop Game"
            icon="🍔"
            initialPosition={{ x: 300, y: 200 }}
            onActivate={() => setShowFoodDrop(true)}
          />
          <DraggableFeatureBubble
            title="Memories"
            icon="💭"
            initialPosition={{ x: 500, y: 400 }}
            onActivate={() => setShowMemories(true)}
          />
          <DraggableFeatureBubble
            title="Spin Wheel"
            icon="🎡"
            initialPosition={{ x: 600, y: 200 }}
            onActivate={() => setShowSpinWheel(true)}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

const App: React.FC = () => (
  <UserProvider>
    <BubbleDismissProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </BubbleDismissProvider>
  </UserProvider>
);

export default App;
