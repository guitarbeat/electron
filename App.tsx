import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from './src/hooks/useAudio';
import { useUser } from './src/context/UserContext';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { MainTab } from './types';
import { useQuiz } from './src/hooks/useQuiz';
import Watchlist from './src/components/watchlist';
import { BubbleDismissProvider } from './src/context/BubbleDismissContext';
import QuizEditor from './src/components/quiz/QuizEditor';
import PlacesList from './src/components/places/PlacesList';
import MinigameModal from './src/components/ui/MinigameModal';
import AppHeader from './src/components/layout/AppHeader';
import FloatingBubbles from './src/components/layout/FloatingBubbles';
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

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuizEditor, setShowQuizEditor] = useState(false);

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

  return (
    <ThemeProvider activeTab={activeTab}>
      <div className="app-shell bg-main">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <AppHeader tabs={MAIN_TABS} activeTab={activeTab} onTabChange={handleTabChange} />

        <main
          id="main-content"
          className="main-container"
          tabIndex={-1}
          aria-label={activeTabMeta?.label || 'Main workspace'}
        >
          <section className="home-hero" aria-label="Home view selector">
            <h2 className="home-hero__title" aria-live="polite">
              <span key={activeTab} className="home-hero__word home-hero__word--animated is-active">
                {activeHeroLabel}
              </span>
            </h2>
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
                {isActivePanel ? (tab.id === 'queue' ? <Watchlist /> : <PlacesList />) : null}
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

        <FloatingBubbles
          quizCompleted={quizCompleted}
          currentUser={currentUser}
          onQuizComplete={handleQuizComplete}
          onOpenQuizEditor={handleOpenQuizEditor}
        />
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
