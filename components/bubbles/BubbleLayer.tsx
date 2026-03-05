import React, { useEffect, useMemo, useRef, useState } from 'react';
import MessageBoard from '../common/MessageBoard';
import SnakeGame from '../snake/SnakeGame';
import FoodDropGame from '../food-drop/FoodDropGame';
import SpinWheel from '../extras/spin-wheel/SpinWheel';
import QuizBubble from '../quiz/QuizBubble';
import MatchmakerBubble from '../matchmaker/MatchmakerBubble';
import type { User } from '../../types';
import type { QuizData } from '../../services/quizService';
import DragDismissZone from '../common/DragDismissZone';
import RestoreBubblesButton from '../common/RestoreBubblesButton';
import { useBubbleDismiss } from '../../context/BubbleDismissContext';
import { BubbleToolId } from './bubbleLayout';
import { useBubbleDocking } from './useBubbleDocking';
import './BubbleLayer.css';

const TOOL_CONFIG: { id: BubbleToolId; label: string; emoji: string }[] = [
  { id: 'messages', label: 'Messages', emoji: '💬' },
  { id: 'spin', label: 'Spin', emoji: '🎰' },
  { id: 'snake', label: 'Snake', emoji: '🐍' },
  { id: 'foodDrop', label: 'Food Drop', emoji: '🍉' },
  { id: 'quiz', label: 'Quiz', emoji: '❓' },
  { id: 'matchmaker', label: 'Matchmaker', emoji: '💕' },
];

interface BubbleLayerProps {
  quizData: QuizData | null | undefined;
  quizCompleted: boolean;
  currentUser: User | null;
  onQuizComplete: () => void;
  onOpenQuizEditor: () => void;
}

const BubbleLayer: React.FC<BubbleLayerProps> = ({
  quizData,
  quizCompleted,
  currentUser,
  onQuizComplete,
  onOpenQuizEditor,
}) => {
  const { isDragging, isHoveringDismiss } = useBubbleDismiss();
  const [activeTool, setActiveTool] = useState<BubbleToolId | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const bubbleIds = useMemo(() => TOOL_CONFIG.map((tool) => tool.id), []);

  const { visibleIds, getBubbleProps, a11yAnnouncement } = useBubbleDocking({
    bubbleIds,
    onActivate: (id) => {
      setActiveTool((previous) => (previous === id ? null : id));
    },
  });

  useEffect(() => {
    if (!activeTool) return;
    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeTool]);

  const renderTool = () => {
    switch (activeTool) {
      case 'messages':
        return <MessageBoard mode="embedded" />;
      case 'spin':
        return <SpinWheel mode="embedded" onRequestClose={() => setActiveTool(null)} />;
      case 'snake':
        return <SnakeGame mode="embedded" onRequestClose={() => setActiveTool(null)} />;
      case 'foodDrop':
        return <FoodDropGame mode="embedded" onRequestClose={() => setActiveTool(null)} />;
      case 'quiz':
        return (
          <QuizBubble
            mode="embedded"
            quizData={quizData}
            quizCompleted={quizCompleted}
            currentUser={currentUser}
            onQuizComplete={onQuizComplete}
            onOpenQuizEditor={onOpenQuizEditor}
          />
        );
      case 'matchmaker':
        return <MatchmakerBubble mode="embedded" currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bubble-launchers" aria-label="Tool bubbles">
        {TOOL_CONFIG.filter((tool) => visibleIds.includes(tool.id)).map((tool) => {
          const { position, isMoveMode, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown } = getBubbleProps(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              className={`bubble-launcher${isMoveMode ? ' is-move-mode' : ''}`}
              style={{ left: position.x, top: position.y }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onKeyDown={onKeyDown}
              aria-label={`${tool.label} bubble${isMoveMode ? ', move mode' : ''}`}
              title={`${tool.label}${isMoveMode ? ' (move mode)' : ''}`}
            >
              <span className="bubble-launcher__emoji" aria-hidden>
                {tool.emoji}
              </span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="sr-only">
        {a11yAnnouncement}
      </div>

      <DragDismissZone visible={isDragging} isHovering={isHoveringDismiss} />
      <RestoreBubblesButton />

      {activeTool && (
        <section className="bubble-tool-panel" role="dialog" aria-modal="true" aria-label="Tool panel">
          <header className="bubble-tool-panel__header">
            <h2 className="bubble-tool-panel__title">
              {TOOL_CONFIG.find((tool) => tool.id === activeTool)?.label}
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="bubble-tool-panel__close"
              onClick={() => setActiveTool(null)}
            >
              Close
            </button>
          </header>
          <div className="bubble-tool-panel__content">{renderTool()}</div>
        </section>
      )}
    </>
  );
};

export default BubbleLayer;
