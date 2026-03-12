import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/ui/Button';
import { useToast } from '@/context';
import { colors, spacing, typography, radius } from '@/design-system/tokens';

const BOARD_WIDTH = 320;
const BOARD_HEIGHT = 420;
const BASKET_WIDTH = 72;
const FOOD_SIZE = 20;
const TICK_MS = 32;
const HIGHSCORE_KEY = 'foodMergeHighScore';
const LEGACY_HIGHSCORE_KEY = 'foodDropHighScore';

type Difficulty = 'easy' | 'normal' | 'hard';

interface FallingFood {
  id: string;
  x: number;
  y: number;
  speed: number;
  emoji: string;
}

const FOOD_EMOJIS = ['🍕', '🍔', '🍟', '🌮', '🍣', '🍿', '🍩'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const difficultyConfig: Record<
  Difficulty,
  { spawnChance: number; speedBoost: number; label: string }
> = {
  easy: { spawnChance: 0.08, speedBoost: 0.9, label: 'Easy' },
  normal: { spawnChance: 0.12, speedBoost: 1, label: 'Normal' },
  hard: { spawnChance: 0.17, speedBoost: 1.18, label: 'Hard' },
};

const getStoredHighScore = () => {
  if (typeof window === 'undefined') return 0;
  const raw =
    window.localStorage.getItem(HIGHSCORE_KEY) ?? window.localStorage.getItem(LEGACY_HIGHSCORE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const FoodMergeGame: React.FC = () => {
  const { showToast } = useToast();
  const [basketX, setBasketX] = useState(BOARD_WIDTH / 2 - BASKET_WIDTH / 2);
  const [foods, setFoods] = useState<FallingFood[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [highScore, setHighScore] = useState(getStoredHighScore);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const directionRef = useRef<0 | 1 | -1>(0);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const isGameOver = lives <= 0;
  const speedMultiplier = (1 + score * 0.015) * difficultyConfig[difficulty].speedBoost;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextHighScore = window.localStorage.getItem(HIGHSCORE_KEY);
    const legacyHighScore = window.localStorage.getItem(LEGACY_HIGHSCORE_KEY);
    if (nextHighScore === null && legacyHighScore !== null) {
      window.localStorage.setItem(HIGHSCORE_KEY, legacyHighScore);
    }
  }, []);

  const resetGame = () => {
    setBasketX(BOARD_WIDTH / 2 - BASKET_WIDTH / 2);
    setFoods([]);
    setScore(0);
    setLives(3);
    setRunning(true);
  };

  useEffect(() => {
    if (!running || isGameOver) return undefined;

    const interval = window.setInterval(() => {
      setBasketX((current) =>
        clamp(current + directionRef.current * 8, 0, BOARD_WIDTH - BASKET_WIDTH)
      );

      setFoods((currentFoods) => {
        const nextFoods = currentFoods
          .map((food) => ({ ...food, y: food.y + food.speed * speedMultiplier }))
          .filter((food) => food.y < BOARD_HEIGHT + FOOD_SIZE);

        if (Math.random() < difficultyConfig[difficulty].spawnChance) {
          nextFoods.push({
            id: crypto.randomUUID(),
            x: Math.random() * (BOARD_WIDTH - FOOD_SIZE),
            y: -FOOD_SIZE,
            speed: 2 + Math.random() * 2,
            emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
          });
        }

        return nextFoods;
      });
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [running, isGameOver, speedMultiplier, difficulty]);

  useEffect(() => {
    if (!running || isGameOver) return;

    const basketLeft = basketX;
    const basketRight = basketX + BASKET_WIDTH;
    const basketTop = BOARD_HEIGHT - 28;

    let caught = 0;
    let missed = 0;

    setFoods((currentFoods) => {
      const remaining: FallingFood[] = [];
      currentFoods.forEach((food) => {
        const foodCenter = food.x + FOOD_SIZE / 2;
        const foodBottom = food.y + FOOD_SIZE;
        const isCaught =
          foodBottom >= basketTop && foodCenter >= basketLeft && foodCenter <= basketRight;

        if (isCaught) {
          caught += 1;
          return;
        }

        if (food.y > BOARD_HEIGHT - FOOD_SIZE / 2) {
          missed += 1;
          return;
        }

        remaining.push(food);
      });
      return remaining;
    });

    if (caught > 0) {
      setScore((current) => current + caught);
    }

    if (missed > 0) {
      setLives((current) => current - missed);
    }
  }, [basketX, foods, running, isGameOver]);

  useEffect(() => {
    if (!isGameOver) return;
    setRunning(false);
    setHighScore((currentHigh) => {
      const next = Math.max(currentHigh, score);
      if (next !== currentHigh && typeof window !== 'undefined') {
        window.localStorage.setItem(HIGHSCORE_KEY, String(next));
        showToast({ message: `New Food Merge high score: ${next}`, type: 'success' });
      } else {
        showToast({ message: `Game over. Score: ${score}`, type: 'info' });
      }
      return next;
    });
  }, [isGameOver, score, showToast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        directionRef.current = -1;
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        directionRef.current = 1;
      }
      if (event.key === ' ' && !running) {
        event.preventDefault();
        resetGame();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === 'ArrowLeft' ||
        event.key.toLowerCase() === 'a' ||
        event.key === 'ArrowRight' ||
        event.key.toLowerCase() === 'd'
      ) {
        directionRef.current = 0;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [running]);

  const statusText = useMemo(() => {
    if (isGameOver) return 'Game over';
    if (!running) return 'Paused';
    return 'Running';
  }, [isGameOver, running]);

  const moveBasketFromPointer = (clientX: number) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const next = clientX - rect.left - BASKET_WIDTH / 2;
    setBasketX(clamp(next, 0, BOARD_WIDTH - BASKET_WIDTH));
  };

  return (
    <div style={{ padding: spacing.md, color: colors.textPrimary }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
          fontSize: typography.fontSize.sm,
          color: colors.textSecondary,
          gap: spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <span>Score: {score}</span>
        <span>Lives: {Math.max(0, lives)}</span>
        <span>Best: {highScore}</span>
        <span>{statusText}</span>
      </div>

      <div
        ref={boardRef}
        style={{
          width: '100%',
          maxWidth: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          margin: '0 auto',
          borderRadius: radius.md,
          border: `1px solid ${colors.borderSecondary}40`,
          background: 'linear-gradient(180deg, rgba(22,32,55,0.9) 0%, rgba(34,18,20,0.95) 100%)',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'none',
        }}
        onPointerMove={(event) => {
          if (!running || isGameOver) return;
          moveBasketFromPointer(event.clientX);
        }}
      >
        {foods.map((food) => (
          <span
            key={food.id}
            style={{
              position: 'absolute',
              left: food.x,
              top: food.y,
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            {food.emoji}
          </span>
        ))}

        <div
          style={{
            position: 'absolute',
            left: basketX,
            bottom: 8,
            width: BASKET_WIDTH,
            height: 18,
            borderRadius: 10,
            background: 'linear-gradient(180deg, #ffe0a8 0%, #d48a4a 100%)',
            border: '1px solid rgba(74, 32, 8, 0.55)',
            boxShadow: '0 6px 10px rgba(0,0,0,0.35)',
          }}
        />
      </div>

      <div
        style={{
          marginTop: spacing.md,
          display: 'flex',
          gap: spacing.sm,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Button variant="primary" size="sm" onClick={resetGame}>
          {isGameOver || !running ? 'Start Game' : 'Restart'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setRunning((value) => !value)}
          disabled={isGameOver}
        >
          {running ? 'Pause' : 'Resume'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setDifficulty((current) =>
              current === 'easy' ? 'normal' : current === 'normal' ? 'hard' : 'easy'
            )
          }
        >
          Difficulty: {difficultyConfig[difficulty].label}
        </Button>
      </div>
    </div>
  );
};

export default FoodMergeGame;
