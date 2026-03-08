import './SnakeGame.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/ui/Button';
import Card from '@/ui/Card';
import { useUser } from '@/context/UserContext';
import { useMediaQuery, breakpoints } from '@/hooks/useMediaQuery';
import { useFloatingBubbleDrag } from '@/hooks/useFloatingBubbleDrag';
import { colors, spacing, typography } from '@/design-system/tokens';
import { useBubbleDismiss } from '@/context/BubbleDismissContext';
import {
  FLOATING_BUBBLE_SIZE,
  getFloatingBubbleBadgeStyle,
  getFloatingBubbleButtonStyle,
  getFloatingContainerStyle,
  getFloatingPanelCardStyle,
} from '@/ui/floatingBubbleStyles';
import {
  createInitialGameState,
  enqueueDirection,
  stepGame,
  Direction,
  GameStatus,
  GridPosition,
  SnakeGameState,
} from './snakeGameLogic';

const BOARD_WIDTH = 16;
const BOARD_HEIGHT = 16;

const INITIAL_TICK_INTERVAL_MS = 140;
const MIN_TICK_INTERVAL_MS = 50;
const SPEED_DECREMENT_PER_FOOD = 2;
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

const SNAKE_LEADERBOARD_KEY = 'snakeLeaderboard';
const GUEST_NAME_STORAGE_KEY = 'movieWatchlistGuestName';
const MAX_LEADERBOARD_ENTRIES = 8;

interface SnakeLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  createdAt: string;
}

function keyForCell(position: GridPosition) {
  return `${position.x},${position.y}`;
}

const loadLeaderboard = (): SnakeLeaderboardEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(SNAKE_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SnakeLeaderboardEntry[];
    if (!Array.isArray(parsed)) return [];

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

const saveLeaderboardLocal = (entries: SnakeLeaderboardEntry[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SNAKE_LEADERBOARD_KEY, JSON.stringify(entries));
};

const getStoredGuestName = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GUEST_NAME_STORAGE_KEY)?.trim() || '';
};

const useSnakeLeaderboard = (currentUser: string | null) => {
  const [leaderboard, setLeaderboard] = useState<SnakeLeaderboardEntry[]>(() => loadLeaderboard());

  const recordScore = useCallback(
    (score: number) => {
      if (score <= 0) return;
      const playerName = currentUser || getStoredGuestName() || 'Guest';
      const newEntry: SnakeLeaderboardEntry = {
        id: `snake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: playerName,
        score,
        createdAt: new Date().toISOString(),
      };

      setLeaderboard((prev) => {
        const updated = [...prev, newEntry]
          .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
          .slice(0, MAX_LEADERBOARD_ENTRIES);
        saveLeaderboardLocal(updated);
        return updated;
      });
    },
    [currentUser]
  );

  const clearLeaderboard = useCallback(() => {
    localStorage.removeItem(SNAKE_LEADERBOARD_KEY);
    setLeaderboard([]);
  }, []);

  const bestScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
  return { leaderboard, recordScore, clearLeaderboard, bestScore };
};

const useSnakeAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playTone = useCallback(
    (frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        } else {
          return;
        }
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    []
  );

  const playEatSound = useCallback(() => {
    playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(900, 'sine', 0.2, 0.1), 50);
  }, [playTone]);

  const playGameOverSound = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      } else {
        return;
      }
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const playMoveSound = useCallback(() => {
    playTone(200, 'triangle', 0.05, 0.02);
  }, [playTone]);

  return { playEatSound, playGameOverSound, playMoveSound };
};

interface SnakeGameProps {
  mode?: 'floating' | 'embedded';
  onRequestClose?: () => void;
}

function useLocalToolHide({
  isEmbedded,
  onRequestClose,
  setIsMinimized,
}: {
  isEmbedded: boolean;
  onRequestClose?: () => void;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return useCallback(() => {
    if (isEmbedded) {
      onRequestClose?.();
      return;
    }
    setIsMinimized(true);
  }, [isEmbedded, onRequestClose, setIsMinimized]);
}

function buildInitialSnakeState(mode: SnakeGameProps['mode']): SnakeGameState {
  const state = createInitialGameState({ width: BOARD_WIDTH, height: BOARD_HEIGHT });
  return mode === 'embedded' ? { ...state, status: 'paused' as const } : state;
}

function gameStatusText(status: SnakeGameState['status']): string {
  if (status === 'paused') return 'Paused';
  if (status === 'game-over') return 'Game Over';
  return 'Playing';
}

const SnakeBoard: React.FC<{
  gameState: SnakeGameState;
  cellSize: number;
  cellGap: number;
  isFullscreen: boolean;
  isMobile: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}> = ({ gameState, cellSize, cellGap, isFullscreen, isMobile, onTouchStart, onTouchEnd }) => {
  const { width, height, snake, food, status } = gameState;
  const snakeCells = useMemo(() => new Set(snake.map(keyForCell)), [snake]);
  const headKey = snake.length > 0 ? keyForCell(snake[0]) : null;
  const boardSize = width * cellSize + (width - 1) * cellGap;
  const scale = isFullscreen ? 1 : isMobile ? 0.95 : 1;

  const baseCellStyle: React.CSSProperties = {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    borderRadius: Math.max(4, Math.floor(cellSize / 6)),
    backgroundColor: `${colors.borderSecondary}22`,
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
          gap: `${cellGap}px`,
          width: `${boardSize}px`,
          maxWidth: '100%',
          margin: '0 auto',
          padding: `${cellGap}px`,
          borderRadius: '12px',
          background: `linear-gradient(180deg, ${colors.surfaceElevated}, ${colors.surface})`,
          border: `1px solid ${colors.borderSecondary}40`,
          touchAction: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          opacity: status === 'paused' ? 0.9 : 1,
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {Array.from({ length: width * height }, (_, index) => {
          const x = index % width;
          const y = Math.floor(index / width);
          const key = keyForCell({ x, y });
          if (x === food.x && y === food.y) {
            return (
              <div
                key={key}
                style={{
                  ...baseCellStyle,
                  backgroundColor: `${colors.accent}CC`,
                  boxShadow: `0 0 10px ${colors.accent}55`,
                }}
              />
            );
          }
          if (snakeCells.has(key)) {
            return (
              <div
                key={key}
                style={{
                  ...baseCellStyle,
                  backgroundColor: key === headKey ? colors.secondary : `${colors.secondary}B0`,
                  boxShadow: key === headKey ? `0 0 8px ${colors.secondary}55` : 'none',
                }}
              />
            );
          }
          return <div key={key} style={baseCellStyle} />;
        })}
      </div>
    </div>
  );
};

const SnakeControls: React.FC<{
  status: GameStatus;
  isMobile: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onDirection: (direction: Direction) => void;
}> = ({ status, isMobile, onTogglePause, onRestart, onDirection }) => {
  const renderDirectionButton = (direction: Direction, label: string) => (
    <Button
      variant="secondary"
      size="sm"
      onPointerDown={(e) => {
        e.preventDefault();
        onDirection(direction);
      }}
      style={{
        width: '56px',
        height: '56px',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        borderRadius: '12px',
        touchAction: 'none',
        userSelect: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: `1px solid ${colors.borderSecondary}40`,
      }}
      aria-label={`Move ${direction}`}
    >
      {label}
    </Button>
  );

  return (
    <>
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
          onClick={onTogglePause}
          disabled={status === 'game-over'}
        >
          {status === 'paused' ? 'Resume' : 'Pause'}
        </Button>
        <Button size="sm" variant="primary" onClick={onRestart}>
          Restart
        </Button>
      </div>

      {isMobile && (
        <div
          style={{
            width: '200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: spacing.md,
            marginTop: spacing.sm,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: spacing.sm,
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
    </>
  );
};

const SnakeLeaderboard: React.FC<{ entries: SnakeLeaderboardEntry[]; onClear: () => void }> = ({
  entries,
  onClear,
}) => {
  return (
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
            fontFamily: typography.fontFamily.heading.join(', '),
            letterSpacing: typography.letterSpacing.normal,
          }}
        >
          Snake Leaderboard
        </h3>
        {entries.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.fontSize.xs }}>
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
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: '10px',
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
  );
};

const SnakeGame: React.FC<SnakeGameProps> = ({ mode = 'floating', onRequestClose }) => {
  const {
    isHidden,
    setDragging: setDismissDragging,
    checkDismissZoneHit,
    dismiss,
  } = useBubbleDismiss();
  const { currentUser } = useUser();
  const isMobile = useMediaQuery(breakpoints.sm);
  const isEmbedded = mode === 'embedded';
  const [gameState, setGameState] = useState<SnakeGameState>(() => buildInitialSnakeState(mode));
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
    setGameState(buildInitialSnakeState(mode));
  }, [mode]);

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

  const handleHide = useLocalToolHide({ isEmbedded, onRequestClose, setIsMinimized });
  const handleMaximize = () => setIsMinimized(false);
  const isViewportExpanded = isFullscreen || (!isEmbedded && !isMinimized);
  const { position: bubblePosition, isDragging: isDraggingBubble, bubbleProps } =
    useFloatingBubbleDrag({
      initialPosition: () => {
        if (typeof window === 'undefined') return { x: 16, y: 16 };
        return {
          x: 20,
          y: window.innerHeight - FLOATING_BUBBLE_SIZE - 86,
        };
      },
      onClick: handleMaximize,
      onDragStart: () => {
        setDismissDragging(true);
      },
      onDragMove: (position) => {
        checkDismissZoneHit(position.x, position.y, FLOATING_BUBBLE_SIZE);
      },
      onDragEnd: ({ wasDragged, position }) => {
        setDismissDragging(false);
        if (wasDragged && checkDismissZoneHit(position.x, position.y, FLOATING_BUBBLE_SIZE)) {
          dismiss('snake');
        }
      },
    });

  const gameStatusLabel = gameStatusText(gameState.status);

  if (isMinimized && !isEmbedded) {
    if (isHidden('snake')) return null;
    return (
      <button
        type="button"
        {...bubbleProps}
        style={{
          ...getFloatingBubbleButtonStyle({
            position: bubblePosition,
            isDragging: isDraggingBubble,
            background:
              'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(145deg, rgba(130, 197, 107, 0.95) 0%, rgba(58, 132, 77, 0.95) 100%)',
            color: '#082913',
            fontSize: '1.4rem',
          }),
        }}
        aria-label="Open Snake Game"
      >
        🐍
        {bestScore > 0 && (
          <span
            style={{
              ...getFloatingBubbleBadgeStyle(),
              fontWeight: typography.fontWeight.bold,
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
      style={getFloatingContainerStyle({
        isEmbedded,
        isViewportExpanded,
        isMobile,
        desktopWidth: '380px',
      })}
    >
      <Card
        style={{
          ...getFloatingPanelCardStyle({
            isViewportExpanded,
            isMobile,
          }),
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
                display: isEmbedded ? 'inline-flex' : 'none',
              }}
            >
              {isFullscreen ? 'Exit Full' : 'Fullscreen'}
            </Button>
          </div>
          {!isEmbedded && !isFullscreen && (
            <Button size="sm" variant="ghost" onClick={handleHide}>
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
