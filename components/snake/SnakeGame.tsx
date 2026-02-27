import './SnakeGame.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useUser } from '../../context/UserContext';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import { colors, radius, spacing, typography, shadows } from '../../design-system/tokens';
import { useSnakeAudio } from './useSnakeAudio';
import {
  createInitialGameState,
  enqueueDirection,
  stepGame,
  Direction,
  SnakeGameState,
} from './snakeGameLogic';
import { useSnakeLeaderboard } from './useSnakeLeaderboard';
import SnakeBoard from './SnakeBoard';
import SnakeControls from './SnakeControls';
import SnakeLeaderboard from './SnakeLeaderboard';

const BOARD_WIDTH = 16;
const BOARD_HEIGHT = 16;

const INITIAL_TICK_INTERVAL_MS = 140;
const MIN_TICK_INTERVAL_MS = 50;
const SPEED_DECREMENT_PER_FOOD = 2; // Speed up by 2ms per food eaten
const CELL_SIZE = 20;
const CELL_GAP = 2;

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

interface SnakeGameProps {
  mode?: 'floating' | 'embedded';
}

const SnakeGame: React.FC<SnakeGameProps> = ({ mode = 'floating' }) => {
  const { currentUser } = useUser();
  const isMobile = useMediaQuery(breakpoints.sm);
  const isEmbedded = mode === 'embedded';
  const [gameState, setGameState] = useState<SnakeGameState>(() =>
    createInitialGameState({ width: BOARD_WIDTH, height: BOARD_HEIGHT })
  );
  const [isMinimized, setIsMinimized] = useState(mode === 'floating');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasRecordedGameOverScore, setHasRecordedGameOverScore] = useState(false);
  const [shake, setShake] = useState(0);

  const { leaderboard, recordScore, clearLeaderboard, bestScore } =
    useSnakeLeaderboard(currentUser);
  const { playEatSound, playGameOverSound, playMoveSound } = useSnakeAudio();

  const isGameVisible = isEmbedded || !isMinimized;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isEmbedded) {
      setIsMinimized(false);
    }
  }, [isEmbedded]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Swipe threshold
    if (Math.max(absX, absY) > 20) {
      if (absX > absY) {
        handleDirection(deltaX > 0 ? 'right' : 'left');
      } else {
        handleDirection(deltaY > 0 ? 'down' : 'up');
      }
    }
    touchStartRef.current = null;
  };

  const restartGame = useCallback(() => {
    setGameState(createInitialGameState({ width: BOARD_WIDTH, height: BOARD_HEIGHT }));
  }, []);

  const handleDirection = useCallback((direction: Direction) => {
    setGameState((previousState) => {
      if (previousState.status === 'paused' || previousState.status === 'game-over') {
        return previousState;
      }
      return enqueueDirection(previousState, direction);
    });
  }, []);

  const togglePause = useCallback(() => {
    setGameState((previousState) => {
      if (previousState.status === 'game-over') {
        return previousState;
      }

      const nextStatus = previousState.status === 'running' ? 'paused' : 'running';
      return {
        ...previousState,
        status: nextStatus,
      };
    });
  }, []);

  useEffect(() => {
    if (!isGameVisible || gameState.status !== 'running') {
      return undefined;
    }

    const currentTickInterval = Math.max(
      MIN_TICK_INTERVAL_MS,
      INITIAL_TICK_INTERVAL_MS - gameState.score * SPEED_DECREMENT_PER_FOOD
    );

    const intervalId = window.setInterval(() => {
      setGameState((previousState) => {
        const nextState = stepGame(previousState);

        // Sound effects logic
        if (nextState.score > previousState.score) {
          playEatSound();
        } else if (nextState.status === 'game-over' && previousState.status === 'running') {
          playGameOverSound();
          setShake(10);
        } else if (
          nextState.snake[0].x !== previousState.snake[0].x ||
          nextState.snake[0].y !== previousState.snake[0].y
        ) {
          // Optional move sound
        }

        return nextState;
      });
    }, currentTickInterval);

    return () => window.clearInterval(intervalId);
  }, [gameState.status, isGameVisible, gameState.score, playEatSound, playGameOverSound]);

  useEffect(() => {
    if (!isGameVisible) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];

      if (direction) {
        event.preventDefault();
        handleDirection(direction);
      } else if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirection, isGameVisible, restartGame, togglePause]);

  useEffect(() => {
    if (gameState.status !== 'game-over') {
      setHasRecordedGameOverScore(false);
      return;
    }

    if (gameState.score <= 0 || hasRecordedGameOverScore) {
      return;
    }

    recordScore(gameState.score);
    setHasRecordedGameOverScore(true);
  }, [gameState.score, gameState.status, hasRecordedGameOverScore, recordScore]);

  const handleMinimize = () => setIsMinimized(true);
  const handleMaximize = () => setIsMinimized(false);

  let gameStatusLabel = 'Playing';
  if (gameState.status === 'paused') gameStatusLabel = 'Paused';
  if (gameState.status === 'game-over') gameStatusLabel = 'Game Over';

  if (isMinimized && !isEmbedded) {
    return (
      <button
        type="button"
        onClick={handleMaximize}
        style={{
          position: 'fixed',
          bottom: `max(${spacing.lg}, env(safe-area-inset-bottom))`,
          right: isMobile ? 'auto' : spacing.lg,
          left: isMobile ? spacing.md : 'auto',
          width: '60px',
          height: '60px',
          borderRadius: radius.full,
          border: `3px solid ${colors.surfaceElevated}`,
          background:
            'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(145deg, rgba(130, 197, 107, 0.95) 0%, rgba(58, 132, 77, 0.95) 100%)',
          color: '#082913',
          fontSize: '1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: shadows.glow,
          padding: 0,
          zIndex: 1000,
        }}
        aria-label="Open Snake Game"
      >
        🐍
        {bestScore > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              minWidth: '24px',
              height: '24px',
              borderRadius: radius.full,
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              fontSize: '11px',
              fontWeight: typography.fontWeight.bold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${colors.accent}`,
              boxShadow: shadows.card,
              padding: '0 4px',
            }}
            aria-label={`Best score ${bestScore}`}
          >
            {bestScore}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2000,
              backgroundColor: colors.surface,
              display: 'flex',
              flexDirection: 'column',
              padding: spacing.md,
            }
          : isEmbedded
            ? {
                position: 'relative',
                width: '100%',
              }
            : {
                position: 'fixed',
                bottom: `max(${spacing.lg}, env(safe-area-inset-bottom))`,
                right: isMobile ? spacing.md : spacing.lg,
                left: isMobile ? spacing.md : 'auto',
                width: isMobile ? 'auto' : 'min(440px, 90vw)',
                zIndex: 1000,
              }
      }
    >
      <Card
        style={{
          padding: spacing.lg,
          border: isFullscreen ? 'none' : `2px solid ${colors.border}`,
          borderRadius: isFullscreen ? 0 : radius.card,
          background: colors.surface,
          boxShadow: isFullscreen ? 'none' : shadows.cardElevated,
          maxHeight: isFullscreen ? '100%' : isMobile ? 'min(78vh, 680px)' : 'min(700px, 80vh)',
          overflowY: 'auto',
          animation: shake > 0 ? 'snake-shake 0.5s' : 'none',
          height: isFullscreen ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        onAnimationEnd={() => setShake(0)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {!isEmbedded && (
              <h2 style={{ margin: 0, fontSize: typography.fontSize.lg, color: colors.textPrimary }}>Snake</h2>
            )}
            <Button size="sm" variant="ghost" className="snake-fullscreen-btn" onClick={() => setIsFullscreen(!isFullscreen)} style={{ padding: '4px 8px', fontSize: 12, border: `1px solid ${colors.borderSecondary}30` }}>
              {isFullscreen ? 'Exit Full' : 'Fullscreen'}
            </Button>
          </div>
          {!isEmbedded && !isFullscreen && <Button size="sm" variant="ghost" onClick={handleMinimize}>Hide</Button>}
        </div>

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

        <SnakeBoard
          gameState={gameState}
          cellSize={CELL_SIZE}
          cellGap={CELL_GAP}
          isFullscreen={isFullscreen}
          isMobile={isMobile}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        <SnakeControls
          status={gameState.status}
          isMobile={isMobile}
          onTogglePause={togglePause}
          onRestart={restartGame}
          onDirection={handleDirection}
        />

        <SnakeLeaderboard entries={leaderboard} onClear={clearLeaderboard} />

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
    </div>
  );
};

export default SnakeGame;
