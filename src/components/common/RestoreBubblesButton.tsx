import React, { useState } from 'react';
import { useBubbleDismiss } from '../../context/BubbleDismissContext';
import type { BubbleId } from '../../context/BubbleDismissContext';

const RestoreBubblesButton: React.FC = () => {
  const { hiddenBubbles, restore } = useBubbleDismiss();
  const [isOpen, setIsOpen] = useState(false);

  if (hiddenBubbles.size === 0) return null;

  const handleRestore = (id: BubbleId) => {
    restore(id);
    if (hiddenBubbles.size === 1) {
      setIsOpen(false);
    }
  };

  const getBubbleLabel = (id: BubbleId): string => {
    const labels: Record<BubbleId, string> = {
      messages: 'Messages',
      spin: 'Spin',
      snake: 'Snake',
      quiz: 'Quiz',
      matchmaker: 'Matchmaker',
      foodDrop: 'Food Drop',
    };
    return labels[id] || id;
  };

  return (
    <div className="restore-bubbles-container">
      <button
        className="restore-bubbles-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Restore dismissed bubbles"
      >
        🔄 {hiddenBubbles.size} bubble{hiddenBubbles.size > 1 ? 's' : ''}
      </button>
      
      {isOpen && (
        <div className="restore-bubbles-menu">
          <div className="restore-bubbles-header">
            Restore Bubbles
          </div>
          {Array.from(hiddenBubbles).map((id) => (
            <button
              key={id}
              className="restore-bubble-item"
              onClick={() => handleRestore(id)}
            >
              🫧 {getBubbleLabel(id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestoreBubblesButton;
