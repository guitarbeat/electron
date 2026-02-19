import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useUser } from '../../context/UserContext';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import { colors, radius, spacing, typography, shadows } from '../../design-system/tokens';
import {
  createInitialGameState,
  enqueueDirection,
  stepGame,
  Direction,
  SnakeGameState,
} from './snakeGameLogic';

const BOARD_WIDTH = 16;
const BOARD_HEIGHT = 16;
const TICK_INTERVAL_MS = 140;
const SNAKE_LEADERBOARD_KEY = 'snakeLeaderboard';
const GUEST_NAME_STORAGE_KEY = 'movieWatchlistGuestName';
const MAX_LEADERBOARD_ENTRIES = 8;
const CELL_SIZE = 20;
const CELL_GAP = 2;

interface SnakeLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  createdAt: string;
}

interface SnakeGameProps {
  mode?: 'floating' | 'embedded';
}

const loadLeaderboard = (): SnakeLeaderboardEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(SNAKE_LEADERBOARD_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SnakeLeaderboardEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry) =>
          typeof entry?.id === 'string' &&
          typeof entry?.name === 'string' &&
          typeof entry?.score === 'number' &&
          Number.isFinite(entry.score) &&
          typeof entry?.createdAt === 'string'
      )
      .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_LEADERBOARD_ENTRIES);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse snake leaderboard:', error);
    return [];
  }
};

const saveLeaderboard = (entries: SnakeLeaderboardEntry[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(SNAKE_LEADERBOARD_KEY, JSON.stringify(entries));
};

const getStoredGuestName = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem(GUEST_NAME_STORAGE_KEY)?.trim() || '';
};

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

const SnakeGame: React.FC<SnakeGameProps> = ({ mode = 'floating' }) => {
  const { currentUser } = useUser();
  const isMobile = useMediaQuery(breakpoints.sm);
  const isEmbedded = mode === 'embedded';
  const [gameState, setGameState] = useState<SnakeGameState>(() =>
    createInitialGameState({ width: BOARD_WIDTH, height: BOARD_HEIGHT })
  );
  const [isMinimized, setIsMinimized] = useState(mode === 'floating');
  const [leaderboard, setLeaderboard] = useState<SnakeLeaderboardEntry[]>(() => loadLeaderboard());
  const [hasRecordedGameOverScore, setHasRecordedGameOverScore] = useState(false);
  const isGameVisible = isEmbedded || !isMinimized;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Best score state (derived)
  const bestScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

  useEffect(() => {
    if (isEmbedded) {
      setIsMinimized(false);
    }
  }, [isEmbedded]);

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
    if (!isGameVisible) {
      return undefined;
    }

    if (gameState.status !== 'running') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setGameState((previousState) => stepGame(previousState));
    }, TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [gameState.status, isGameVisible]);

  useEffect(() => {
    if (!isGameVisible) {
      return undefined;
    }

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
  }, [handleDirection, isGameVisible, restartGame, togglePause]);

  useEffect(() => {
    if (gameState.status !== 'game-over') {
      setHasRecordedGameOverScore(false);
      return;
    }

    if (gameState.score <= 0 || hasRecordedGameOverScore) {
      return;
    }

    const playerName = currentUser || getStoredGuestName() || 'Guest';
    const newEntry: SnakeLeaderboardEntry = {
      id: `snake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: playerName,
      score: gameState.score,
      createdAt: new Date().toISOString(),
    };

    setLeaderboard((prev) => {
      const updated = [...prev, newEntry]
        .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
        .slice(0, MAX_LEADERBOARD_ENTRIES);
      saveLeaderboard(updated);
      return updated;
    });

    setHasRecordedGameOverScore(true);
  }, [currentUser, gameState.score, gameState.status, hasRecordedGameOverScore]);

  // Canvas Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, snake, food } = gameState;

    // Calculate canvas internal resolution
    const totalWidth = width * CELL_SIZE + (width - 1) * CELL_GAP;
    const totalHeight = height * CELL_SIZE + (height - 1) * CELL_GAP;

    // Update canvas size if needed (avoids clearing if size matches, but we clear anyway)
    if (canvas.width !== totalWidth || canvas.height !== totalHeight) {
      canvas.width = totalWidth;
      canvas.height = totalHeight;
    }

    // Clear background
    ctx.fillStyle = colors.borderInset;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Helper for rounded rect (polyfilled logic for broad compatibility or standard)
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
      } else {
        // Fallback for older browsers
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
      }
    };

    // Draw grid cells (empty)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = x * (CELL_SIZE + CELL_GAP);
        const py = y * (CELL_SIZE + CELL_GAP);
        drawRoundedRect(px, py, CELL_SIZE, CELL_SIZE, 2);
      }
    }

    // Draw Food
    ctx.fillStyle = colors.yellow;
    const fx = food.x * (CELL_SIZE + CELL_GAP);
    const fy = food.y * (CELL_SIZE + CELL_GAP);
    drawRoundedRect(fx, fy, CELL_SIZE, CELL_SIZE, 2);

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? colors.secondary : colors.accent;
      const sx = segment.x * (CELL_SIZE + CELL_GAP);
      const sy = segment.y * (CELL_SIZE + CELL_GAP);
      drawRoundedRect(sx, sy, CELL_SIZE, CELL_SIZE, 2);
    });
  }, [gameState]);

  const handleMinimize = () => setIsMinimized(true);
  const handleMaximize = () => setIsMinimized(false);
  const handleClearLeaderboard = () => {
    localStorage.removeItem(SNAKE_LEADERBOARD_KEY);
    setLeaderboard([]);
  };

  const renderDirectionButton = (direction: Direction, label: string) => (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => handleDirection(direction)}
      style={{
        width: '44px',
        height: '44px',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
      }}
      aria-label={`Move ${direction}`}
    >
      {label}
    </Button>
  );

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
        isEmbedded
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
          border: `2px solid ${colors.border}`,
          borderRadius: radius.card,
          background: colors.surface,
          boxShadow: shadows.cardElevated,
          maxHeight: isMobile ? 'min(78vh, 680px)' : 'min(700px, 80vh)',
          overflowY: 'auto',
        }}
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
          <h2
            style={{
              margin: 0,
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
            }}
          >
            Snake
          </h2>
          {!isEmbedded && (
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

        <div
          role="application"
          aria-label="Snake game board"
          style={{
            width: isMobile ? 'min(88vw, 340px)' : '360px',
            maxWidth: '100%',
            aspectRatio: '1 / 1',
            borderRadius: radius.md,
            backgroundColor: colors.borderInset,
            marginBottom: spacing.md,
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '2px',
            display: 'flex',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              borderRadius: '4px',
            }}
          />
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

        <div
          style={{
            marginTop: spacing.sm,
            marginBottom: spacing.sm,
            borderTop: `1px solid ${colors.borderInset}`,
            paddingTop: spacing.sm,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.xs,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                color: colors.textPrimary,
                fontFamily: "'Papyrus', 'Copperplate', 'Palatino Linotype', 'Book Antiqua', serif",
                letterSpacing: '0.03em',
              }}
            >
              Snake Leaderboard
            </h3>
            {leaderboard.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearLeaderboard}>
                Clear
              </Button>
            )}
          </div>

          {leaderboard.length === 0 ? (
            <p
              style={{
                margin: 0,
                color: colors.textSecondary,
                fontSize: typography.fontSize.xs,
              }}
            >
              No scores yet. Finish a run to claim the top spot.
            </p>
          ) : (
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}
            >
              {leaderboard.map((entry, index) => (
                <li
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr auto',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: radius.md,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${colors.borderSecondary}25`,
                  }}
                >
                  <span
                    style={{
                      color: colors.textTertiary,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.bold,
                    }}
                  >
                    #{index + 1}
                  </span>
                  <span
                    style={{
                      color: colors.textPrimary,
                      fontSize: typography.fontSize.sm,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={entry.name}
                  >
                    {entry.name}
                  </span>
                  <span
                    style={{
                      color: colors.accent,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                    }}
                  >
                    {entry.score}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

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
