import React, { useEffect, useMemo, useState } from 'react';
import { colors, shadows, spacing, typography } from '@/theme/tokens';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import Button from '@/ui/Button';
import {
  createSnakeGameState,
  queueSnakeDirection,
  restartSnakeGame,
  stepSnakeGame,
  toggleSnakePause,
  type SnakeDirection,
  type SnakeGameState,
} from './snakeEngine.ts';

const TICK_MS = 160;
const BOARD_COLUMNS = 14;
const BOARD_ROWS = 14;

const KEY_TO_DIRECTION: Partial<Record<string, SnakeDirection>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

const CONTROL_LAYOUT: Array<{ direction: SnakeDirection; label: string }> = [
  { direction: 'up', label: '↑' },
  { direction: 'left', label: '←' },
  { direction: 'down', label: '↓' },
  { direction: 'right', label: '→' },
];

const buildPositionKey = ({ x, y }: { x: number; y: number }): string => `${x}:${y}`;

const getStatusLabel = (game: SnakeGameState): string => {
  if (game.status === 'game-over') {
    return 'Game Over';
  }

  if (game.status === 'paused') {
    return 'Paused';
  }

  return 'Running';
};

const SnakeGame: React.FC = () => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)');
  const [game, setGame] = useState(() =>
    createSnakeGameState({
      boardWidth: BOARD_COLUMNS,
      boardHeight: BOARD_ROWS,
    })
  );

  const shouldShowTouchControls = isMobile || isTouch;

  useEffect(() => {
    if (game.status !== 'running') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setGame((current) => stepSnakeGame(current));
    }, TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [game.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mappedDirection = KEY_TO_DIRECTION[event.key] ?? KEY_TO_DIRECTION[event.key.toLowerCase()];

      if (mappedDirection) {
        event.preventDefault();
        setGame((current) => queueSnakeDirection(current, mappedDirection));
        return;
      }

      if (event.key === ' ' || event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setGame((current) => (current.status === 'game-over' ? restartSnakeGame(current) : toggleSnakePause(current)));
        return;
      }

      if (event.key.toLowerCase() === 'r' || event.key === 'Enter') {
        event.preventDefault();
        setGame((current) => restartSnakeGame(current));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const snakeCells = useMemo(() => new Set(game.snake.map(buildPositionKey)), [game.snake]);
  const headKey = buildPositionKey(game.snake[0]);
  const foodKey = game.food ? buildPositionKey(game.food) : null;

  return (
    <div className="snake-game-shell" style={{ padding: spacing.lg, color: colors.textPrimary }}>
      <div className="snake-game-header">
        <div className="snake-game-stat">
          <span className="snake-game-stat__label">Score</span>
          <strong className="snake-game-stat__value">{game.score}</strong>
        </div>
        <div className="snake-game-stat">
          <span className="snake-game-stat__label">State</span>
          <strong className="snake-game-stat__value">{getStatusLabel(game)}</strong>
        </div>
        <div className="snake-game-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setGame((current) => toggleSnakePause(current))}
            disabled={game.status === 'game-over'}
            className="snake-game-action"
          >
            {game.status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant={game.status === 'game-over' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setGame((current) => restartSnakeGame(current))}
            className="snake-game-action"
          >
            Restart
          </Button>
        </div>
      </div>

      <div className="snake-game-stage">
        <div
          className="snake-game-board"
          style={{
            gridTemplateColumns: `repeat(${game.boardWidth}, minmax(0, 1fr))`,
          }}
          aria-label="Snake board"
        >
          {Array.from({ length: game.boardWidth * game.boardHeight }, (_, index) => {
            const x = index % game.boardWidth;
            const y = Math.floor(index / game.boardWidth);
            const cellKey = buildPositionKey({ x, y });
            const isHead = cellKey === headKey;
            const isFood = cellKey === foodKey;
            const isSnake = snakeCells.has(cellKey);

            return (
              <div
                key={cellKey}
                className={`snake-game-cell ${
                  isHead ? 'snake-game-cell--head' : isSnake ? 'snake-game-cell--snake' : ''
                } ${isFood ? 'snake-game-cell--food' : ''}`}
              />
            );
          })}

          {game.status !== 'running' ? (
            <div className="snake-game-overlay" aria-live="polite">
              <p
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamilyValue.heading,
                  fontSize: typography.fontSize.xl,
                  letterSpacing: typography.letterSpacing.wider,
                  textTransform: 'uppercase',
                  textShadow: shadows.textGlow,
                }}
              >
                {game.status === 'game-over' ? 'Game Over' : 'Paused'}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {shouldShowTouchControls ? (
        <div className="snake-game-touch">
          <div className="snake-game-touch__grid">
            <div />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setGame((current) => queueSnakeDirection(current, 'up'))}
              className="snake-game-touch__button"
              aria-label="Move up"
            >
              ↑
            </Button>
            <div />
            {CONTROL_LAYOUT.slice(1).map((control) => (
              <Button
                key={control.direction}
                size="sm"
                variant="ghost"
                onClick={() => setGame((current) => queueSnakeDirection(current, control.direction))}
                className="snake-game-touch__button"
                aria-label={`Move ${control.direction}`}
              >
                {control.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SnakeGame;
