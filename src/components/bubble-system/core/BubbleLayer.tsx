import React from 'react';
import MessageBoard from '../../common/MessageBoard';
import SnakeGame from '../../snake/SnakeGame';
import SpinWheel from '../../extras/spin-wheel/SpinWheel';
import MatchmakerBubble from '../../matchmaker/MatchmakerBubble';
import QuizBubble from '../../quiz/QuizBubble';
import DragDismissZone from '../../common/DragDismissZone';
import RestoreBubblesButton from '../../common/RestoreBubblesButton';
import { useQuiz } from '../../../hooks/useQuiz';
import { useUser } from '../../../context/UserContext';
import { useBubbleDismiss } from '../../../context/BubbleDismissContext';
import { useBubbleDocking } from '../hooks/useBubbleDocking';
import { BUBBLE_TOOLS, getToolConfig } from '../tools/bubbleTools';
import type { BubbleToolId } from '../types/bubbleLayout';
import './BubbleLayer.css';

interface BubbleLayerProps {
  quizCompleted: boolean;
  onQuizComplete: () => void;
  onOpenQuizEditor: () => void;
}

const BubbleLayer: React.FC<BubbleLayerProps> = ({
  quizCompleted,
  onQuizComplete,
  onOpenQuizEditor,
}) => {
  const { isDragging, isHoveringDismiss } = useBubbleDismiss();
  const [activeTool, setActiveTool] = React.useState<BubbleToolId | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const bubbleIds = React.useMemo(() => BUBBLE_TOOLS.map((tool) => tool.id), []);

  const { visibleIds, getBubbleProps, a11yAnnouncement } = useBubbleDocking({
    bubbleIds,
    onActivate: (id) => {
      setActiveTool((previous) => (previous === id ? null : id));
    },
  });

  React.useEffect(() => {
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
        return <div>Food Drop Game (Embedded)</div>;
      case 'quiz':
        return (
          <div>
            Quiz Component (Embedded)
            {/* Will be properly integrated */}
          </div>
        );
      case 'matchmaker':
        return (
          <div>
            Matchmaker Component (Embedded)
            {/* Will be properly integrated */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bubble-launchers" aria-label="Tool bubbles">
        {BUBBLE_TOOLS.filter((tool) => visibleIds.includes(tool.id)).map((tool) => {
          const props = getBubbleProps(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              className={`bubble-launcher${props.isMoveMode ? ' is-move-mode' : ''}`}
              style={{ left: props.position.x, top: props.position.y }}
              onPointerDown={props.onPointerDown}
              onPointerMove={props.onPointerMove}
              onPointerUp={props.onPointerUp}
              onPointerCancel={props.onPointerCancel}
              onKeyDown={props.onKeyDown}
              aria-label={`${tool.label} bubble${props.isMoveMode ? ', move mode' : ''}`}
              title={`${tool.label}${props.isMoveMode ? ' (move mode)' : ''}`}
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
        <section
          className="bubble-tool-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Tool panel"
        >
          <header className="bubble-tool-panel__header">
            <h2 className="bubble-tool-panel__title">
              {getToolConfig(activeTool)?.label}
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
