import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  SnakeGameState,
  Direction,
  createInitialGameState,
  stepGame,
  enqueueDirection,
  SnakeLeaderboardEntry,
} from './snakeGameLogic';
import { colors, radius, spacing, shadows, typography } from '../../design-system/tokens';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import useSnakeAudio from './useSnakeAudio';
import { useUser } from '../../context/UserContext';
import { getStoredGuestName } from '../../services/movieService';

interface SnakeGameProps {
  initialWidth?: number;
  initialHeight?: number;
  onMinimize?: () => void;
  isEmbedded?: boolean;
  mode?: string;
}

const SnakeGame: React.FC<SnakeGameProps> = ({
  initialWidth = 20,
  initialHeight = 20,
  onMinimize,
  isEmbedded = false,
  mode, // Add mode usage
}) => {
  const [gameState, setGameState] = useState<SnakeGameState>(() =>
    createInitialGameState({ width: initialWidth, height: initialHeight })
  );
  const [isGameVisible, setIsGameVisible] = useState(true);
  const [leaderboard, setLeaderboard] = useState<SnakeLeaderboardEntry[]>([]);
  const [hasRecordedGameOverScore, setHasRecordedGameOverScore] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const gameLoopRef = useRef<number | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { playTone, playEatSound, playGameOverSound, playMoveSound } = useSnakeAudio();
  const { currentUser } = useUser();

  // Handle mode prop if necessary, or just acknowledge it
  useEffect(() => {
    if (mode === 'test') {
      // Could initialize in test mode
    }
  }, [mode]);

  // Load leaderboard and best score on mount
  useEffect(() => {
    const saved = localStorage.getItem('snake_leaderboard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLeaderboard(parsed);
        if (parsed.length > 0) {
          setBestScore(parsed[0].score);
        }
      } catch (e) {
        console.error('Failed to parse leaderboard', e);
      }
    }
  }, []);

  // Save leaderboard when it updates
  useEffect(() => {
    localStorage.setItem('snake_leaderboard', JSON.stringify(leaderboard));
    if (leaderboard.length > 0) {
      setBestScore(leaderboard[0].score);
    }
  }, [leaderboard]);

  const handleDirection = useCallback(
    (newDir: Direction) => {
      setGameState((prev) => {
        // Prevent 180 degree turns
        const currentDir = prev.direction;
        if (
          (newDir === 'up' && currentDir === 'down') ||
          (newDir === 'down' && currentDir === 'up') ||
          (newDir === 'left' && currentDir === 'right') ||
          (newDir === 'right' && currentDir === 'left')
        ) {
          return prev;
        }
        // Only play move sound if direction actually changes and game is running
        if (newDir !== prev.queuedDirection && prev.status === 'running') {
          playMoveSound();
        }
        return enqueueDirection(prev, newDir);
      });
    },
    [playMoveSound]
  );

  const restartGame = useCallback(() => {
    setGameState(createInitialGameState({ width: initialWidth, height: initialHeight }));
    setHasRecordedGameOverScore(false);
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, [initialWidth, initialHeight]);

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev.status === 'game-over') return prev;
      return {
        ...prev,
        status: prev.status === 'running' ? 'paused' : 'running',
      };
    });
  }, []);

  // Game Loop
  useEffect(() => {
    let lastTime = 0;
    const speed = Math.max(50, 150 - Math.floor(gameState.score / 2) * 5); // Speed up as score increases

    const loop = (time: number) => {
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;

      if (deltaTime > speed) {
        setGameState((prev) => {
          if (prev.status !== 'running') return prev;

          const nextState = stepGame(prev);

          if (nextState.score > prev.score) {
            playEatSound();
          }

          if (nextState.status === 'game-over' && prev.status === 'running') {
            playGameOverSound();
          }

          return nextState;
        });
        lastTime = time;
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    if (gameState.status === 'running') {
      gameLoopRef.current = requestAnimationFrame(loop);
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.status, gameState.score, playEatSound, playGameOverSound]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameVisible) return;

      // Prevent default scrolling for arrow keys if game is focused/visible
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleDirection('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleDirection('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleDirection('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleDirection('right');
          break;
        case ' ': // Spacebar
          togglePause();
          break;
        case 'r':
        case 'R':
          restartGame();
          break;
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
      const newLeaderboard = [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10); // Keep top 10
      return newLeaderboard;
    });

    setHasRecordedGameOverScore(true);
  }, [gameState.status, gameState.score, currentUser, hasRecordedGameOverScore]);

  const handleMinimize = () => {
    setIsGameVisible(false);
    if (onMinimize) onMinimize();
  };

  const handleMaximize = () => {
    setIsGameVisible(true);
  };

  const handleClearLeaderboard = () => {
    if (window.confirm('Are you sure you want to clear the leaderboard?')) {
      setLeaderboard([]);
      setBestScore(0);
    }
  };

  // Rendering helpers
  const getPositionKey = (pos: { x: number; y: number }) => `${pos.x},${pos.y}`;
  const snakeCells = new Set(gameState.snake.map(getPositionKey));
  const foodCellKey = getPositionKey(gameState.food);
  const headCellKey = getPositionKey(gameState.snake[0]);

  // For grid rendering
  const totalCells = gameState.width * gameState.height;

  let gameStatusLabel = 'Playing';
  if (gameState.status === 'paused') gameStatusLabel = 'Paused';
  if (gameState.status === 'game-over') gameStatusLabel = 'Game Over';

  const renderDirectionButton = (dir: Direction, label: string) => (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => handleDirection(dir)}
      style={{
        width: '48px',
        height: '48px',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
      }}
      aria-label={`Move ${dir}`}
    >
      {label}
    </Button>
  );

  if (!isGameVisible) {
    if (isEmbedded) return null; // If embedded and hidden, render nothing (parent handles visibility)

    return (
      <button
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
