import React, { useState } from 'react';
import { User } from '../../types';
import Matchmaker from './Matchmaker';
import { colors, spacing, radius, shadows } from '../../design-system/tokens';
import './MatchmakerBubble.css';

interface MatchmakerBubbleProps {
  currentUser: User | null;
}

const MatchmakerBubble: React.FC<MatchmakerBubbleProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Bubble Button */}
      <button
        className={`matchmaker-bubble-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close matchmaker' : 'Open matchmaker'}
        title={isOpen ? 'Close matchmaker' : 'Open matchmaker'}
      >
        {isOpen ? '×' : '💕'}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="matchmaker-bubble-panel">
          <div className="matchmaker-bubble-header">
            <h3 style={{ margin: 0, color: colors.textPrimary }}>Matchmaker</h3>
            <button
              className="matchmaker-bubble-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close matchmaker"
            >
              ×
            </button>
          </div>
          <div className="matchmaker-bubble-content">
            <Matchmaker currentUser={currentUser} />
          </div>
        </div>
      )}
    </>
  );
};

export default MatchmakerBubble;
