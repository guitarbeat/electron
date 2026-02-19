import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useUser } from '../../context/UserContext';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import { colors, radius, spacing, typography, shadows } from '../../design-system/tokens';
import {
  createInitialGameState,
  enqueueDirection,
  getPositionKey,
  stepGame,
} from './snakeGameLogic';
import type { Direction, SnakeGameState } from './snakeGameLogic';
import { useSnakeAudio } from './useSnakeAudio';

const BOARD_WIDTH = 16;
const BOARD_HEIGHT = 16;

const INITIAL_TICK_INTERVAL_MS = 140;
const MIN_TICK_INTERVAL_MS = 50;
const SPEED_DECREMENT_PER_FOOD = 2; // Speed up by 2ms per food eaten
const SNAKE_LEADERBOARD_KEY = 'snakeLeaderboard';

const GUEST_NAME_STORAGE_KEY = 'movieWatchlistGuestName';
const MAX_LEADERBOARD_ENTRIES = 8;

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
  const { playEatSound, playGameOverSound, playMoveSound } = useSnakeAudio();
  const isGameVisible = isEmbedded || !isMinimized;
  const [shake, setShake] = useState(0);

  // Reset shake when game restarts
  useEffect(() => {
    if (gameState.status === 'running' && gameState.score === 0) {
      setShake(0);
    }
  }, [gameState.status, gameState.score]);

  // Audio effects and shake triggers
  useEffect(() => {
    if (gameState.status === 'game-over') {
      playGameOverSound();
      setShake(10); // Start shake intensity
    }
  }, [gameState.status, playGameOverSound]);

  // Previous score ref to detect score increase
  const prevScoreRef = React.useRef(gameState.score);
  useEffect(() => {
    if (gameState.score > prevScoreRef.current) {
      playEatSound();
    }
    prevScoreRef.current = gameState.score;
  }, [gameState.score, playEatSound]);

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

    const currentTickInterval = Math.max(
      MIN_TICK_INTERVAL_MS,
      INITIAL_TICK_INTERVAL_MS - gameState.score * SPEED_DECREMENT_PER_FOOD
    );

    const intervalId = window.setInterval(() => {
      setGameState((previousState) => stepGame(previousState));
      // Optional: tick sound? Might be annoying if too frequent.
    }, currentTickInterval);

    return () => {
      window.clearInterval(intervalId);
    };

  }, [gameState.status, isGameVisible, gameState.score]);

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

    setLeaderboard((previousEntries) => {
      const nextEntries = [...previousEntries, newEntry]
        .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
        .slice(0, MAX_LEADERBOARD_ENTRIES);
      saveLeaderboard(nextEntries);
      return nextEntries;
    });

    setHasRecordedGameOverScore(true);
  }, [currentUser, gameState.score, gameState.status, hasRecordedGameOverScore]);

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

  const handleOpen = () => {
    if (isEmbedded) return;
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    if (isEmbedded) return;
    setIsMinimized(true);
    setGameState((previousState) => {
      if (previousState.status === 'running') {
        return { ...previousState, status: 'paused' };
      }
      return previousState;
    });
  };

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

  const bestScore = leaderboard[0]?.score || 0;

  const handleClearLeaderboard = () => {
    setLeaderboard([]);
    saveLeaderboard([]);
  };

  if (!isEmbedded && isMinimized) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open snake game"
        className="gel-bubble"
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
      <style>
        {`
            @keyframes snake-shake {
              0% { transform: translate(1px, 1px) rotate(0deg); }
              10% { transform: translate(-1px, -2px) rotate(-1deg); }
              20% { transform: translate(-3px, 0px) rotate(1deg); }
              30% { transform: translate(3px, 2px) rotate(0deg); }
              40% { transform: translate(1px, -1px) rotate(1deg); }
              50% { transform: translate(-1px, 2px) rotate(-1deg); }
              60% { transform: translate(-3px, 1px) rotate(0deg); }
              70% { transform: translate(3px, 1px) rotate(-1deg); }
              80% { transform: translate(-1px, -1px) rotate(1deg); }
              90% { transform: translate(1px, 2px) rotate(0deg); }
              100% { transform: translate(1px, -2px) rotate(-1deg); }
            }
          `}
      </style>
      <Card
        style={{
          padding: spacing.lg,
          border: `2px solid ${colors.border}`,
          borderRadius: radius.card,
          background: colors.surface,
          boxShadow: shadows.cardElevated,
          maxHeight: isMobile ? 'min(78vh, 680px)' : 'min(700px, 80vh)',
          overflowY: 'auto',
          animation: shake > 0 ? 'snake-shake 0.5s' : 'none',
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
            let borderRadius = '2px';
            let transform = 'none';

            if (isSnake) {
              cellColor = colors.accent;
              borderRadius = '4px';
              // Slightly scale down snake segments for a "separated" look
              transform = 'scale(0.92)';
            }

            if (isFood) {
              cellColor = colors.yellow;
              borderRadius = '50%';
              transform = 'scale(0.8)';
            }

            if (isHead) {
              cellColor = colors.secondary;
              borderRadius = '4px';
              transform = 'scale(1)';
            }

            return (
              <div
                key={cellKey}
                style={{
                  borderRadius,
                  backgroundColor: cellColor,
                  transform,
                  position: 'relative',
                  transition: 'transform 0.1s',
                }}
              >
                {isHead && (
                  <>
                    {(() => {
                      const eyeBase = {
                        position: 'absolute' as const,
                        width: '20%',
                        height: '20%',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        zIndex: 2,
                      };
                      switch (gameState.direction) {
                        case 'up':
                          return (
                            <>
                              <div style={{ ...eyeBase, top: '10%', left: '20%' }} />
                              <div style={{ ...eyeBase, top: '10%', right: '20%' }} />
                            </>
                          );
                        case 'down':
                          return (
                            <>
                              <div style={{ ...eyeBase, bottom: '10%', left: '20%' }} />
                              <div style={{ ...eyeBase, bottom: '10%', right: '20%' }} />
                            </>
                          );
                        case 'left':
                          return (
                            <>
                              <div style={{ ...eyeBase, top: '20%', left: '10%' }} />
                              <div style={{ ...eyeBase, bottom: '20%', left: '10%' }} />
                            </>
                          );
                        case 'right':
                          return (
                            <>
                              <div style={{ ...eyeBase, top: '20%', right: '10%' }} />
                              <div style={{ ...eyeBase, bottom: '20%', right: '10%' }} />
                            </>
                          );
                      }
                    })()}
                  </>
                )}
              </div>
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
