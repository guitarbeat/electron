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
const SPEED_DECREMENT_PER_FOOD = 2;
const CELL_SIZE = 20;
const CELL_GAP = 2;

const BUBBLE_SIZE = 60;
const BUBBLE_EDGE_MARGIN = 16;
const DRAG_THRESHOLD = 4;

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
  const [gameState, setGameState] = useState<SnakeGameState>(() => {
    const state = createInitialGameState({ width: BOARD_WIDTH, height: BOARD_HEIGHT });
    return mode === 'embedded' ? { ...state, status: 'paused' as const } : state;
  });
  const [isMinimized, setIsMinimized] = useState(mode === 'floating');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasRecordedGameOverScore, setHasRecordedGameOverScore] = useState(false);
  const [shake, setShake] = useState(0);
  const [bubblePosition, setBubblePosition] = useState(() => {
    if (typeof window === 'undefined') return { x: BUBBLE_EDGE_MARGIN, y: BUBBLE_EDGE_MARGIN };
    const defaultX = BUBBLE_EDGE_MARGIN + 4;
    const defaultY = window.innerHeight - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN - 70;
    return { x: defaultX, y: defaultY };
  });
  const [isDraggingBubble, setIsDraggingBubble] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: { x: number; y: number };
  } | null>(null);
  const didDragRef = useRef(false);

  const { leaderboard, recordScore, clearLeaderboard, bestScore } =
    useSnakeLeaderboard(currentUser);
  const { playEatSound, playGameOverSound, playMoveSound } = useSnakeAudio();

  const isGameVisible = isEmbedded || !isMinimized;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const clampBubble = (x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };
    const maxX = Math.max(BUBBLE_EDGE_MARGIN, window.innerWidth - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN);
    const maxY = Math.max(
      BUBBLE_EDGE_MARGIN,
      window.innerHeight - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN
    );
    return {
      x: Math.min(Math.max(x, BUBBLE_EDGE_MARGIN), maxX),
      y: Math.min(Math.max(y, BUBBLE_EDGE_MARGIN), maxY),
    };
  };

  const handleBubblePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: bubblePosition,
    };
    didDragRef.current = false;
    setIsDraggingBubble(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - ds.startX;
    const deltaY = event.clientY - ds.startY;
    if (
      !didDragRef.current &&
      (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }
    if (!didDragRef.current) return;
    setBubblePosition(clampBubble(ds.origin.x + deltaX, ds.origin.y + deltaY));
  };

  const handleBubblePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    if (!didDragRef.current) {
      handleMaximize();
    }
    setIsDraggingBubble(false);
    dragStateRef.current = null;
    didDragRef.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release capture errors
    }
  };

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
          playMoveSound();
        }

        return nextState;
      });
    }, currentTickInterval);

    return () => window.clearInterval(intervalId);
  }, [
    gameState.status,
    isGameVisible,
    gameState.score,
    playEatSound,
    playGameOverSound,
    playMoveSound,
  ]);

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
        onPointerDown={handleBubblePointerDown}
        onPointerMove={handleBubblePointerMove}
        onPointerUp={handleBubblePointerUp}
        onPointerCancel={handleBubblePointerUp}
        style={{
          position: 'fixed',
          left: bubblePosition.x,
          top: bubblePosition.y,
          width: `${BUBBLE_SIZE}px`,
          height: `${BUBBLE_SIZE}px`,
          borderRadius: radius.full,
          border: `3px solid ${colors.surfaceElevated}`,
          background:
            'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(145deg, rgba(130, 197, 107, 0.95) 0%, rgba(58, 132, 77, 0.95) 100%)',
          color: '#082913',
          fontSize: '1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingBubble ? 'grabbing' : 'grab',
          boxShadow: shadows.glow,
          padding: 0,
          zIndex: 1000,
          touchAction: 'none',
          userSelect: 'none',
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
                right: spacing.lg,
                width: isMobile ? 'calc(100vw - 32px)' : '380px',
                maxWidth: '100%',
                zIndex: 1000,
              }
      }
    >
      <Card
        style={{
          padding: isMobile && !isFullscreen ? spacing.md : spacing.lg,
          border: isFullscreen ? 'none' : `1px solid ${colors.borderSecondary}30`,
          borderRadius: isFullscreen ? 0 : '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: isFullscreen
            ? 'none'
            : '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
          maxHeight: isFullscreen ? '100%' : 'min(520px, 75vh)',
          overflowY: 'auto',
          animation: shake > 0 ? 'snake-shake 0.5s' : 'none',
          height: isFullscreen ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          margin: isMobile && !isFullscreen ? '0 8px' : 0,
        }}
        onAnimationEnd={() => setShake(0)}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
            gap: spacing.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {!isEmbedded && (
              <h2
                style={{ margin: 0, fontSize: typography.fontSize.lg, color: colors.textPrimary }}
              >
                Snake
              </h2>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="snake-fullscreen-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                border: `1px solid ${colors.borderSecondary}30`,
              }}
            >
              {isFullscreen ? 'Exit Full' : 'Fullscreen'}
            </Button>
          </div>
          {!isEmbedded && !isFullscreen && (
            <Button size="sm" variant="ghost" onClick={handleMinimize}>
              Hide
            </Button>
          )}
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
          cellSize={isMobile && !isFullscreen ? 16 : CELL_SIZE}
          cellGap={isMobile && !isFullscreen ? 1 : CELL_GAP}
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

        {(isFullscreen || isEmbedded) && (
          <SnakeLeaderboard entries={leaderboard} onClear={clearLeaderboard} />
        )}

        {!isMobile && (
          <p
            style={{
              marginBottom: 0,
              textAlign: 'center',
              color: colors.textTertiary,
              fontSize: typography.fontSize.xs,
            }}
          >
            Arrow keys / WASD to move · Space to pause · R to restart
          </p>
        )}
      </Card>
    </div>
  );
};

export default SnakeGame;
