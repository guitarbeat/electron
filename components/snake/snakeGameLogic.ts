export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameStatus = 'running' | 'paused' | 'game-over';

export interface GridPosition {
  x: number;
  y: number;
}

export interface SnakeGameState {
  width: number;
  height: number;
  snake: GridPosition[];
  direction: Direction;
  queuedDirection: Direction;
  food: GridPosition;
  score: number;
  status: GameStatus;
}

export interface SnakeLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  createdAt: string;
}

interface SnakeGameConfig {
  width: number;
  height: number;
  initialSnakeLength?: number;
}

export type RandomFn = () => number;

const DEFAULT_INITIAL_SNAKE_LENGTH = 3;

const DIRECTION_VECTORS: Record<Direction, GridPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function getPositionKey(position: GridPosition): string {
  return `${position.x},${position.y}`;
}

export function isOppositeDirection(
  currentDirection: Direction,
  nextDirection: Direction
): boolean {
  return OPPOSITE_DIRECTION[currentDirection] === nextDirection;
}

function isOutOfBounds(position: GridPosition, width: number, height: number): boolean {
  return position.x < 0 || position.y < 0 || position.x >= width || position.y >= height;
}

function arePositionsEqual(first: GridPosition, second: GridPosition): boolean {
  return first.x === second.x && first.y === second.y;
}

function buildInitialSnake(
  width: number,
  height: number,
  initialSnakeLength: number
): GridPosition[] {
  const normalizedLength = Math.min(Math.max(initialSnakeLength, 2), width);
  const headX = Math.max(normalizedLength - 1, Math.floor(width / 2));
  const headY = Math.floor(height / 2);

  return Array.from({ length: normalizedLength }, (_, index) => ({
    x: headX - index,
    y: headY,
  }));
}

export function generateFoodPosition(
  width: number,
  height: number,
  occupiedCells: GridPosition[],
  random: RandomFn = Math.random
): GridPosition | null {
  const occupiedKeys = new Set(occupiedCells.map(getPositionKey));
  const freeCells: GridPosition[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = getPositionKey({ x, y });
      if (!occupiedKeys.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const randomIndex = Math.min(freeCells.length - 1, Math.floor(random() * freeCells.length));
  return freeCells[randomIndex];
}

export function createInitialGameState(
  config: SnakeGameConfig,
  random: RandomFn = Math.random
): SnakeGameState {
  const { width, height, initialSnakeLength = DEFAULT_INITIAL_SNAKE_LENGTH } = config;

  if (width < 2 || height < 2) {
    throw new Error('Snake board must be at least 2x2.');
  }

  const snake = buildInitialSnake(width, height, initialSnakeLength);
  const food = generateFoodPosition(width, height, snake, random);

  if (!food) {
    throw new Error('Unable to place food on the board.');
  }

  return {
    width,
    height,
    snake,
    direction: 'right',
    queuedDirection: 'right',
    food,
    score: 0,
    status: 'running',
  };
}

export function enqueueDirection(state: SnakeGameState, nextDirection: Direction): SnakeGameState {
  if (state.status !== 'running') {
    return state;
  }

  if (state.queuedDirection !== state.direction) {
    return state;
  }

  if (nextDirection === state.direction || isOppositeDirection(state.direction, nextDirection)) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  };
}

export function stepGame(state: SnakeGameState, random: RandomFn = Math.random): SnakeGameState {
  if (state.status !== 'running') {
    return state;
  }

  const movementVector = DIRECTION_VECTORS[state.queuedDirection];
  const currentHead = state.snake[0];

  const nextHead = {
    x: currentHead.x + movementVector.x,
    y: currentHead.y + movementVector.y,
  };

  const willEatFood = arePositionsEqual(nextHead, state.food);
  const snakeBodyWithoutMovingTail = willEatFood ? state.snake : state.snake.slice(0, -1);
  const hasSelfCollision = snakeBodyWithoutMovingTail.some((segment) =>
    arePositionsEqual(segment, nextHead)
  );

  if (isOutOfBounds(nextHead, state.width, state.height) || hasSelfCollision) {
    return {
      ...state,
      direction: state.queuedDirection,
      queuedDirection: state.queuedDirection,
      status: 'game-over',
    };
  }

  const nextSnake = [nextHead, ...snakeBodyWithoutMovingTail];

  if (!willEatFood) {
    return {
      ...state,
      snake: nextSnake,
      direction: state.queuedDirection,
      queuedDirection: state.queuedDirection,
    };
  }

  const nextFood = generateFoodPosition(state.width, state.height, nextSnake, random);

  return {
    ...state,
    snake: nextSnake,
    direction: state.queuedDirection,
    queuedDirection: state.queuedDirection,
    food: nextFood ?? state.food,
    score: state.score + 1,
    status: nextFood ? 'running' : 'game-over',
  };
}
