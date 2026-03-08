import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from './src/hooks/useAudio';
import { useQuiz } from './src/hooks/useQuiz';
import { UserProvider, useUser } from './src/context/UserContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { MainTab } from './src/types';
import Watchlist from './src/components/watchlist';
import { BubbleDismissProvider } from './src/context/BubbleDismissContext';
import QuizEditor from './src/components/quiz/QuizEditor';
import QuizFlow from './src/components/quiz/QuizFlow';
import PlacesList from './src/components/places/PlacesList';
import Matchmaker from './src/components/matchmaker/Matchmaker';
import FoodDropGame from './src/components/extras/FoodDropGame';
import SpinWheelGame from './src/components/extras/SpinWheelGame';
import FloatingMemoriesPanel from './src/components/memories/FloatingMemoriesPanel';
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
    label: 'Watchlist',
  },
  {
    id: 'places',
    label: 'Places',
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
  const commandDeck = useMemo(
    () => [
      {
        label: quizCompleted ? 'Edit Quiz' : 'Start Quiz',
        action: () => setShowQuizEditor(true),
      },
      {
        label: 'Memories',
        action: () => setShowMemories(true),
      },
      {
        label: 'Spin Wheel',
        action: () => setShowSpinWheel(true),
      },
      {
        label: 'Food Drop',
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

        <div className="app-frame">
          <aside className="control-rail" aria-label="Workspace navigation">
            <div className="control-rail__panel">
              <p className="control-rail__eyebrow">Dashboard</p>
              <h1 className="control-rail__title">Weekend planner</h1>
            </div>

            <div className="control-rail__panel">
              <div className="control-rail__section-head">
                <span>User</span>
              </div>
              <UserSelection variant="inline" />
              {currentUser ? <p className="control-rail__meta">{currentUser}</p> : null}
            </div>
          </aside>

          <main id="main-content" className="workspace-stage" tabIndex={-1}>
            <section className="workspace-header" aria-label="Current workspace overview">
              <div>
                <h2 className="workspace-header__title" aria-live="polite">
                  {activeTabMeta?.label}
                </h2>
              </div>
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
                        {item.label}
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
