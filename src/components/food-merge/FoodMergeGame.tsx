import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/ui/Button';
import { useToast } from '@/context';
import { colors, spacing, typography, radius } from '@/design-system';
import appleImage from '@/components/food-merge/assets/fruits/apple.svg';
import blueberryImage from '@/components/food-merge/assets/fruits/blueberry.svg';
import dragonfruitImage from '@/components/food-merge/assets/fruits/dragonfruit.svg';
import grapeImage from '@/components/food-merge/assets/fruits/grape.svg';
import honeydewImage from '@/components/food-merge/assets/fruits/honeydew.svg';
import lemonImage from '@/components/food-merge/assets/fruits/lemon.svg';
import orangeImage from '@/components/food-merge/assets/fruits/orange.svg';
import peachImage from '@/components/food-merge/assets/fruits/peach.svg';
import pearImage from '@/components/food-merge/assets/fruits/pear.svg';
import pineappleImage from '@/components/food-merge/assets/fruits/pineapple.svg';
import watermelonImage from '@/components/food-merge/assets/fruits/watermelon.svg';

const BOARD_WIDTH = 320;
const BOARD_HEIGHT = 420;
const BASKET_WIDTH = 72;
const FOOD_SIZE = 20;
const TICK_MS = 32;
const HIGHSCORE_KEY = 'foodMergeHighScore';

type Difficulty = 'easy' | 'normal' | 'hard';
type FruitKey = 'apple' | 'blueberry' | 'dragonfruit' | 'grape' | 'honeydew' | 'lemon' | 'orange' | 'peach' | 'pear' | 'pineapple' | 'watermelon';

interface FallingFood {
  id: string;
  x: number;
  y: number;
  speed: number;
  emoji: string;
  fruit: FruitKey;
}

const FRUIT_LIST: FruitKey[] = [
  'apple',
  'blueberry',
  'dragonfruit',
  'grape',
  'honeydew',
  'lemon',
  'orange',
  'peach',
  'pear',
  'pineapple',
  'watermelon',
];

const FRUIT_DIFFICULTY_SPAWN_LIMIT: Record<Difficulty, number> = {
  easy: 4,
  normal: 7,
  hard: FRUIT_LIST.length,
};

const MERGE_BONUS_MULTIPLIER = 2;
const BASKET_PREVIEW_LIMIT = 8;

const FRUIT_SCORE = FRUIT_LIST.reduce<Record<FruitKey, number>>(
  (accumulator, _fruit, index) => {
    accumulator[FRUIT_LIST[index]] = (index + 1) * 10;
    return accumulator;
  },
  {} as Record<FruitKey, number>
);

const FRUIT_EMOJIS: Record<FruitKey, string> = {
  apple: '🍎',
  blueberry: '🫐',
  dragonfruit: '🐉',
  grape: '🍇',
  honeydew: '🍈',
  lemon: '🍋',
  orange: '🍊',
  peach: '🍑',
  pear: '🍐',
  pineapple: '🍍',
  watermelon: '🍉',
};

type BasketState = number[];

const FRUIT_INDEX: Record<FruitKey, number> = FRUIT_LIST.reduce<Record<FruitKey, number>>(
  (accumulator, fruit, index) => {
    accumulator[fruit] = index;
    return accumulator;
  },
  {} as Record<FruitKey, number>
);

const getEmptyBasket = () => FRUIT_LIST.map(() => 0);

const mergeIntoBasket = (state: BasketState, incoming: FruitKey[]) => {
  const nextState = [...state];
  let bonus = 0;

  incoming.forEach((fruit) => {
    let level = FRUIT_INDEX[fruit];
    let carry = 1;

    while (carry > 0) {
      const atTop = level >= FRUIT_LIST.length - 1;
      if (atTop) {
        const nextCount = nextState[level] + carry;
        const carryOver = Math.floor(nextCount / 2);
        nextState[level] = nextCount % 2;
        bonus += carryOver * FRUIT_SCORE[FRUIT_LIST[level]] * MERGE_BONUS_MULTIPLIER;
        carry = 0;
        return;
      }

      const nextCount = nextState[level] + carry;
      const carryOver = Math.floor(nextCount / 2);
      nextState[level] = nextCount % 2;
      if (carryOver === 0) {
        carry = 0;
      } else {
        bonus += carryOver * FRUIT_SCORE[FRUIT_LIST[level]] * MERGE_BONUS_MULTIPLIER;
        carry = carryOver;
        level += 1;
      }
    }
  });

  return { nextState, bonus };
};

const FRUIT_ASSETS: Record<FruitKey, string> = {
  apple: appleImage,
  blueberry: blueberryImage,
  dragonfruit: dragonfruitImage,
  grape: grapeImage,
  honeydew: honeydewImage,
  lemon: lemonImage,
  orange: orangeImage,
  peach: peachImage,
  pear: pearImage,
  pineapple: pineappleImage,
  watermelon: watermelonImage,
};

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
  const raw = window.localStorage.getItem(HIGHSCORE_KEY);
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
  const [basketState, setBasketState] = useState<BasketState>(() => getEmptyBasket());
  const basketStateRef = useRef<BasketState>(getEmptyBasket());
  const directionRef = useRef<0 | 1 | -1>(0);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const isGameOver = lives <= 0;
  const speedMultiplier = (1 + score * 0.015) * difficultyConfig[difficulty].speedBoost;


  const resetGame = () => {
    setBasketX(BOARD_WIDTH / 2 - BASKET_WIDTH / 2);
    setFoods([]);
    setScore(0);
    setLives(3);
    setBasketState(getEmptyBasket());
    setRunning(true);
  };

  useEffect(() => {
    basketStateRef.current = basketState;
  }, [basketState]);

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
          const maxIndex = FRUIT_DIFFICULTY_SPAWN_LIMIT[difficulty];
          const fruit = FRUIT_LIST[Math.floor(Math.random() * maxIndex)];
          nextFoods.push({
            id: crypto.randomUUID(),
            x: Math.random() * (BOARD_WIDTH - FOOD_SIZE),
            y: -FOOD_SIZE,
            speed: 2 + Math.random() * 2,
            fruit,
            emoji: FRUIT_EMOJIS[fruit],
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

    const caught: FruitKey[] = [];
    let missed = 0;

    setFoods((currentFoods) => {
      const remaining: FallingFood[] = [];
      currentFoods.forEach((food) => {
        const foodCenter = food.x + FOOD_SIZE / 2;
        const foodBottom = food.y + FOOD_SIZE;
        const isCaught =
          foodBottom >= basketTop && foodCenter >= basketLeft && foodCenter <= basketRight;

        if (isCaught) {
          caught.push(food.fruit);
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

    if (caught.length > 0) {
      const caughtScore = caught.reduce((sum, fruit) => sum + FRUIT_SCORE[fruit], 0);
      const { nextState, bonus } = mergeIntoBasket(basketStateRef.current, caught);
      setBasketState(nextState);
      setScore((current) => current + caughtScore + bonus);
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
        event.preventDefault();
        directionRef.current = -1;
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        event.preventDefault();
        directionRef.current = 1;
      }
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        if (!running) {
          resetGame();
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === 'ArrowLeft' ||
        event.key.toLowerCase() === 'a' ||
        event.key === 'ArrowRight' ||
        event.key.toLowerCase() === 'd'
      ) {
        event.preventDefault();
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

  const basketPreview = useMemo(() => {
    const preview: FruitKey[] = [];
    for (let index = FRUIT_LIST.length - 1; index >= 0; index -= 1) {
      const count = basketState[index];
      for (let repeat = 0; repeat < count; repeat += 1) {
        preview.push(FRUIT_LIST[index]);
      }
    }
    return preview.slice(-BASKET_PREVIEW_LIMIT);
  }, [basketState]);

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
        {foods.map((food) => {
          const asset = FRUIT_ASSETS[food.fruit];
          if (!asset) {
            return (
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
            );
          }

          return (
            <img
              key={food.id}
              src={asset}
              alt={food.emoji}
              role="presentation"
              draggable={false}
              style={{
                position: 'absolute',
                left: food.x,
                top: food.y,
                width: FOOD_SIZE,
                height: FOOD_SIZE,
                objectFit: 'contain',
              }}
            />
          );
        })}

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
        >
          {basketPreview.length === 0 ? null : (
            <div
              style={{
                position: 'absolute',
                inset: '2px 3px 2px 3px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                pointerEvents: 'none',
              }}
            >
              {basketPreview.map((fruit, index) => (
                <img
                  key={`${fruit}-${index}`}
                  src={FRUIT_ASSETS[fruit]}
                  alt={FRUIT_EMOJIS[fruit]}
                  draggable={false}
                  style={{ width: 12, height: 12, objectFit: 'contain' }}
                />
              ))}
            </div>
          )}
        </div>
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
