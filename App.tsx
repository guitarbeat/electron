import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from './src/hooks/useAudio';
import { breakpoints, useMediaQuery } from './src/hooks/useMediaQuery';
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
import TabBar from './src/components/ui/TabBar';
import { ToastProvider } from './src/context/ToastContext';
import './App.css';

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'queue', label: 'Movie Nights', icon: '🎬' },
  { id: 'places', label: 'Date Spots', icon: '📍' },
];

const AppInner: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const { quizData } = useQuiz();
  const isMobile = useMediaQuery(breakpoints.sm);

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

  const handleTabChange = (tab: MainTab) => {
    if (tab !== activeTab) {
      playSwitch();
    }
    setActiveTab(tab);
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    localStorage.setItem('quizCompleted', 'true');
  };

  const handleOpenQuizEditor = () => {
    setShowQuizEditor(true);
  };

  const activeTabMeta = useMemo(() => MAIN_TABS.find((item) => item.id === activeTab), [activeTab]);
  const activeHeroLabel = activeTabMeta?.label || MAIN_TABS[0].label;
  const activeTabDescription =
    activeTab === 'queue'
      ? 'Curate tonight’s lineup, capture memories, and run matchmaker in one place.'
      : 'Pin future date spots, compare ideas, and build your next city adventure.';

  return (
    <ThemeProvider activeTab={activeTab}>
      <div className="app-shell bg-main">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ChromaticDotField className="app-dot-background" density={0.72} mode="background" />

        <header className="app-header">
          <div className={`app-header-shell${isMobile ? ' is-mobile' : ''}`}>
            <div className="app-header-inner app-header-inner--minimal">
              <div className="app-header-profile">
                <UserSelection variant="inline" />
              </div>
            </div>

            <div className="app-header-nav-row">
              <TabBar tabs={MAIN_TABS} activeTab={activeTab} onChange={handleTabChange} />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="main-container"
          tabIndex={-1}
          aria-label={activeTabMeta?.label || 'Main workspace'}
        >
          <section className="home-hero" aria-label="Home view selector">
            <div className="home-hero__content">
              <p className="home-hero__eyebrow">Weekend Control Room</p>
              <h2 className="home-hero__title" aria-live="polite">
                <span
                  key={activeTab}
                  className="home-hero__word home-hero__word--animated is-active"
                >
                  {activeHeroLabel}
                </span>
              </h2>
              <p className="home-hero__subtitle">{activeTabDescription}</p>

              <div className="home-hero__chips" aria-label="Current mode details">
                <span className="home-chip">Live Mode: {activeTabMeta?.label}</span>
                {currentUser ? <span className="home-chip">Pilot: {currentUser}</span> : null}
              </div>
            </div>
          </section>

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
        </main>

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
              onEdit={handleOpenQuizEditor}
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
