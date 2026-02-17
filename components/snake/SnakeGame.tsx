import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import { colors, radius, spacing, typography, shadows } from '../../design-system/tokens';
import {
  createInitialGameState,
  enqueueDirection,
  getPositionKey,
  stepGame,
} from './snakeGameLogic';
import type { Direction, SnakeGameState } from './snakeGameLogic';

const BOARD_WIDTH = 16;
const BOARD_HEIGHT = 16;
const TICK_INTERVAL_MS = 140;

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  a: 'left',
  A: 'left',
  s: 'down',
  S: 'down',
  d: 'right',
  D: 'right',
};

const SnakeGame: React.FC = () => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const [gameState, setGameState] = useState<SnakeGameState>(() =>
    createInitialGameState({ width: BOARD_WIDTH, height: BOARD_HEIGHT })
  );

  const restartGame = useCallback(() => {
    setGameState(createInitialGameState({ width: BOARD_WIDTH, height: BOARD_HEIGHT }));
  }, []);

  const handleDirection = useCallback((direction: Direction) => {
    setGameState((previousState) => enqueueDirection(previousState, direction));
  }, []);

  const togglePause = useCallback(() => {
    setGameState((previousState) => {
      if (previousState.status === 'game-over') {
        return previousState;
      }

      return {
        ...previousState,
        status: previousState.status === 'running' ? 'paused' : 'running',
      };
    });
  }, []);

  useEffect(() => {
    if (gameState.status !== 'running') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setGameState((previousState) => stepGame(previousState));
    }, TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [gameState.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];

      if (direction) {
        event.preventDefault();
        handleDirection(direction);
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirection, restartGame, togglePause]);

  const snakeCells = useMemo(
    () => new Set(gameState.snake.map((segment) => getPositionKey(segment))),
    [gameState.snake]
  );
  const headCellKey = getPositionKey(gameState.snake[0]);
  const foodCellKey = getPositionKey(gameState.food);
  const totalCells = gameState.width * gameState.height;
  let gameStatusLabel = 'Running';

  if (gameState.status === 'game-over') {
    gameStatusLabel = 'Game Over';
  } else if (gameState.status === 'paused') {
    gameStatusLabel = 'Paused';
  }

  const renderDirectionButton = (direction: Direction, label: string) => {
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => handleDirection(direction)}
        style={{
          minWidth: '44px',
          minHeight: '44px',
          padding: '0',
          lineHeight: 1,
          fontSize: typography.fontSize.base,
        }}
        aria-label={`Move ${direction}`}
      >
        {label}
      </Button>
    );
  };

  return (
    <Card
      style={{
        marginTop: spacing.xl,
        padding: spacing.lg,
        border: `2px solid ${colors.border}`,
        borderRadius: radius.card,
        background: colors.surface,
        boxShadow: shadows.cardElevated,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: spacing.sm,
          fontSize: typography.fontSize.lg,
          color: colors.textPrimary,
        }}
      >
        Snake
      </h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
          color: colors.textSecondary,
          fontSize: typography.fontSize.sm,
        }}
      >
        <span>Score: {gameState.score}</span>
        <span>{gameStatusLabel}</span>
      </div>

      <div
        role="application"
        aria-label="Snake game board"
        style={{
          width: isMobile ? 'min(88vw, 340px)' : '360px',
          maxWidth: '100%',
          aspectRatio: '1 / 1',
          display: 'grid',
          gridTemplateColumns: `repeat(${gameState.width}, minmax(0, 1fr))`,
          gap: '2px',
          padding: '2px',
          borderRadius: radius.md,
          backgroundColor: colors.borderInset,
          marginBottom: spacing.md,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {Array.from({ length: totalCells }, (_, index) => {
          const x = index % gameState.width;
          const y = Math.floor(index / gameState.width);
          const cellKey = getPositionKey({ x, y });
          const isHead = cellKey === headCellKey;
          const isFood = cellKey === foodCellKey;
          const isSnake = snakeCells.has(cellKey);
          let cellColor = 'rgba(255,255,255,0.06)';

          if (isSnake) {
            cellColor = colors.accent;
          }

          if (isFood) {
            cellColor = colors.yellow;
          }

          if (isHead) {
            cellColor = colors.secondary;
          }

          return (
            <div
              key={cellKey}
              style={{
                borderRadius: '2px',
                backgroundColor: cellColor,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: spacing.sm,
        }}
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={togglePause}
          disabled={gameState.status === 'game-over'}
        >
          {gameState.status === 'paused' ? 'Resume' : 'Pause'}
        </Button>
        <Button size="sm" variant="primary" onClick={restartGame}>
          Restart
        </Button>
      </div>

      {isMobile && (
        <div
          style={{
            width: '170px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: spacing.sm,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: spacing.xs,
            justifyItems: 'center',
          }}
        >
          <span />
          {renderDirectionButton('up', '↑')}
          <span />
          {renderDirectionButton('left', '←')}
          {renderDirectionButton('down', '↓')}
          {renderDirectionButton('right', '→')}
        </div>
      )}

      <p
        style={{
          marginBottom: 0,
          textAlign: 'center',
          color: colors.textTertiary,
          fontSize: typography.fontSize.xs,
        }}
      >
        Move with arrow keys or WASD. Press Space to pause and R to restart.
      </p>
    </Card>
  );
};

export default SnakeGame;
