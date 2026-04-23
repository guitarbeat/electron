import React, { useState, useCallback } from 'react';
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

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const games: GameInfo[] = [
    {
      id: 'spin-wheel',
      title: 'Spin Wheel',
      description: 'Spin to pick a random movie',
      icon: <RotateCcw className="game-card__icon" />,
      gradient: 'var(--gradient-primary)',
      onClick: onSpinWheel || (() => {}),
    },
    {
      id: 'spin-match',
      title: 'Spin & Match',
      description: 'Match movies with genres',
      icon: <Dices className="game-card__icon" />,
      gradient:
        'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 90%, transparent) 0%, color-mix(in srgb, var(--color-secondary) 60%, var(--color-accent)) 100%)',
      onClick: onSpinMatch || (() => {}),
    },
    {
      id: 'movie-quiz',
      title: 'Personality Quiz',
      description: 'Test how well you know each other',
      icon: <HelpCircle className="game-card__icon" />,
      gradient:
        'linear-gradient(135deg, color-mix(in srgb, var(--color-tertiary) 90%, transparent) 0%, color-mix(in srgb, var(--color-tertiary) 55%, var(--color-quaternary)) 100%)',
      onClick: onMovieQuiz || (() => {}),
    },
  ];

  return (
    <div className={`game-drawer ${isExpanded ? 'game-drawer--expanded' : ''}`}>
      <button
        className="game-drawer__toggle"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="game-drawer-content"
      >
        <div className="game-drawer__toggle-content">
          <Gamepad2 className="game-drawer__toggle-icon" />
          <span className="game-drawer__toggle-text">Games &amp; Quizzes</span>
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
        id="game-drawer-content"
        className="game-drawer__content"
        role="region"
        aria-hidden={!isExpanded}
      >
        <div className="game-drawer__games">
          {games.map((game) => (
            <button
              key={game.id}
              className="game-card"
              onClick={game.onClick}
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
