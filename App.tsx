import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from './hooks/useAudio';
import { useUser } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainTab } from './types';
import { useQuiz } from './hooks/useQuiz';
import Watchlist from './components/watchlist';
import MessageBoard from './components/common/MessageBoard';
import SnakeGame from './components/snake/SnakeGame';
import FoodDropGame from './components/food-drop/FoodDropGame';
import SpinWheel from './components/extras/spin-wheel/SpinWheel';
import MatchmakerBubble from './components/matchmaker/MatchmakerBubble';
import QuizBubble from './components/quiz/QuizBubble';
import { BubbleDismissProvider } from './context/BubbleDismissContext';
import QuizEditor from './components/quiz/QuizEditor';
import PlacesList from './components/places/PlacesList';
import MinigameModal from './components/ui/MinigameModal';
import AppHeader from './components/layout/AppHeader';
import ToolsDrawer, { ToolId } from './components/tools/ToolsDrawer';
import './App.css';

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'queue', label: 'Movies', icon: '🎬' },
  { id: 'places', label: 'Places', icon: '📍' },
];

const TOOL_OPTIONS: { id: ToolId; label: string }[] = [
  { id: 'messages', label: 'Messages' },
  { id: 'spin', label: 'Spin' },
  { id: 'snake', label: 'Snake' },
  { id: 'food-drop', label: 'Food Drop' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'matchmaker', label: 'Matchmaker' },
];

const AppInner: React.FC = () => {
  const { currentUser } = useUser();
  const { playSwitch } = useAudio();
  const { quizData } = useQuiz(true);

  const [activeTab, setActiveTab] = useState<MainTab>('queue');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() => {
    return localStorage.getItem('quizCompleted') === 'true';
  });
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId>('messages');

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

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'messages':
        return <MessageBoard mode="embedded" />;
      case 'spin':
        return <SpinWheel mode="embedded" />;
      case 'snake':
        return <SnakeGame mode="embedded" />;
      case 'food-drop':
        return <FoodDropGame mode="embedded" />;
      case 'quiz':
        return (
          <QuizBubble
            mode="embedded"
            quizData={quizData}
            quizCompleted={quizCompleted}
            currentUser={currentUser}
            onQuizComplete={handleQuizComplete}
            onOpenQuizEditor={handleOpenQuizEditor}
          />
        );
      case 'matchmaker':
        return <MatchmakerBubble mode="embedded" currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider activeTab={activeTab}>
      <div className="app-shell bg-main">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <AppHeader
          tabs={MAIN_TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
        />

        <main
          id="main-content"
          className="main-container"
          tabIndex={-1}
          aria-label={activeTabMeta?.label || 'Main workspace'}
        >
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
                {isActivePanel ? (
                  tab.id === 'queue' ? (
                    <Watchlist />
                  ) : (
                    <PlacesList />
                  )
                ) : null}
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

        <button
          type="button"
          className="tools-launcher"
          onClick={() => setIsToolsOpen(true)}
          aria-haspopup="dialog"
          aria-controls="tools-drawer"
          aria-expanded={isToolsOpen}
        >
          Tools
        </button>

        <ToolsDrawer
          isOpen={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          options={TOOL_OPTIONS}
        >
          {isToolsOpen ? renderActiveTool() : null}
        </ToolsDrawer>
      </div>
    </ThemeProvider>
  );
};

const App: React.FC = () => (
  <BubbleDismissProvider>
    <AppInner />
  </BubbleDismissProvider>
);

export default App;
