import React, { useCallback, useId, useState } from 'react';
import { ChevronDown, ChevronUp, Gamepad2, Dices, HelpCircle, RotateCcw } from 'lucide-react';
import './GameDrawer.css';

interface GameInfo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

interface GameDrawerProps {
  onSpinWheel?: () => void;
  onSpinMatch?: () => void;
  onMovieQuiz?: () => void;
  defaultExpanded?: boolean;
}

export const GameDrawer: React.FC<GameDrawerProps> = ({
  onSpinWheel,
  onSpinMatch,
  onMovieQuiz,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const games: GameInfo[] = [
    {
      id: 'spin-wheel',
      title: 'Spin Wheel',
      description: 'Spin to pick a random movie',
      icon: <RotateCcw className="game-card__icon" />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      onClick: onSpinWheel || (() => {}),
    },
    {
      id: 'spin-match',
      title: 'Spin & Match',
      description: 'Match movies with genres',
      icon: <Dices className="game-card__icon" />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      onClick: onSpinMatch || (() => {}),
    },
    {
      id: 'movie-quiz',
      title: 'Personality Quiz',
      description: 'Test how well you know each other',
      icon: <HelpCircle className="game-card__icon" />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      onClick: onMovieQuiz || (() => {}),
    },
  ];

  return (
    <div className={`game-drawer ${isExpanded ? 'game-drawer--expanded' : ''}`}>
      <button
        type="button"
        className="game-drawer__toggle"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="game-drawer__toggle-content">
          <Gamepad2 className="game-drawer__toggle-icon" />
          <span className="game-drawer__toggle-text">Quick Games</span>
          <span className="game-drawer__toggle-hint">Pick a random movie or test your knowledge</span>
        </div>
        <div className="game-drawer__toggle-chevron">
          {isExpanded ? (
            <ChevronUp className="game-drawer__chevron-icon" />
          ) : (
            <ChevronDown className="game-drawer__chevron-icon" />
          )}
        </div>
      </button>

      <div
        id={contentId}
        className="game-drawer__content"
        role="region"
        aria-label="Quick games"
        aria-hidden={!isExpanded}
      >
        <div className="game-drawer__games">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              className="game-card"
              onClick={game.onClick}
              disabled={!isExpanded}
              style={{ '--game-gradient': game.gradient } as React.CSSProperties}
            >
              <div className="game-card__icon-wrapper">
                {game.icon}
              </div>
              <div className="game-card__info">
                <span className="game-card__title">{game.title}</span>
                <span className="game-card__description">{game.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameDrawer;
