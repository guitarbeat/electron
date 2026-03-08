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
}[] = [
  {
    id: 'queue',
    label: 'Movie Nights',
  },
  {
    id: 'places',
    label: 'Date Spots',
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

  const commandDeck = useMemo(
    () => [
      {
        label: quizCompleted ? 'Retune Quiz' : 'Run Quiz',
        description: quizCompleted ? 'Edit quiz settings.' : 'Start the quiz.',
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
          <main id="main-content" className="workspace-stage" tabIndex={-1}>
            <section className="hero-board" aria-label="Current workspace overview">
              <div className="hero-board__content">
                <h2 className="hero-board__title" aria-live="polite">
                  <span key={activeTab} className="hero-board__title-word">
                    {MAIN_TABS.find((t) => t.id === activeTab)?.label}
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
                        <span className="hero-mode-toggle__label">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="workspace-grid">
              <section className="workspace-surface" aria-label="Primary workspace">
                <div style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <UserSelection variant="inline" />
                </div>
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
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </main>
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
