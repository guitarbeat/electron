export interface GridPosition {
  x: number;
  y: number;
}

export type SnakeDirection = 'up' | 'down' | 'left' | 'right';
export type SnakeStatus = 'running' | 'paused' | 'game-over';
export type RandomSource = () => number;

export interface SnakeGameState {
  boardWidth: number;
  boardHeight: number;
  snake: GridPosition[];
  direction: SnakeDirection;
  queuedDirection: SnakeDirection | null;
  food: GridPosition | null;
  score: number;
  status: SnakeStatus;
}

export interface CreateSnakeGameOptions {
  boardWidth?: number;
  boardHeight?: number;
}

const DEFAULT_BOARD_WIDTH = 14;
const DEFAULT_BOARD_HEIGHT = 14;
const DEFAULT_SNAKE_LENGTH = 3;

const DIRECTION_VECTORS: Record<SnakeDirection, GridPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTIONS: Record<SnakeDirection, SnakeDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const positionsMatch = (a: GridPosition, b: GridPosition): boolean => a.x === b.x && a.y === b.y;

const serializePosition = ({ x, y }: GridPosition): string => `${x}:${y}`;

const clampRandomIndex = (length: number, randomSource: RandomSource): number => {
  if (length <= 1) {
    return 0;
  }

  const next = randomSource();
  const normalized = Number.isFinite(next) ? next : 0;
  return Math.min(length - 1, Math.max(0, Math.floor(normalized * length)));
};

const buildInitialSnake = (boardWidth: number, boardHeight: number): GridPosition[] => {
  const centerY = Math.floor(boardHeight / 2);
  const headX = Math.max(DEFAULT_SNAKE_LENGTH - 1, Math.floor(boardWidth / 2));

  return Array.from({ length: DEFAULT_SNAKE_LENGTH }, (_, index) => ({
    x: headX - index,
    y: centerY,
  }));
};

export const createFoodPosition = (
  boardWidth: number,
  boardHeight: number,
  occupiedPositions: GridPosition[],
  randomSource: RandomSource = Math.random
): GridPosition | null => {
  const occupied = new Set(occupiedPositions.map(serializePosition));
  const availableCells: GridPosition[] = [];

  for (let y = 0; y < boardHeight; y += 1) {
    for (let x = 0; x < boardWidth; x += 1) {
      const position = { x, y };
      if (!occupied.has(serializePosition(position))) {
        availableCells.push(position);
      }
    }
  }

  if (availableCells.length === 0) {
    return null;
  }

  return availableCells[clampRandomIndex(availableCells.length, randomSource)];
};

export const createSnakeGameState = (
  options: CreateSnakeGameOptions = {},
  randomSource: RandomSource = Math.random
): SnakeGameState => {
  const boardWidth = options.boardWidth ?? DEFAULT_BOARD_WIDTH;
  const boardHeight = options.boardHeight ?? DEFAULT_BOARD_HEIGHT;
  const snake = buildInitialSnake(boardWidth, boardHeight);

  return {
    boardWidth,
    boardHeight,
    snake,
    direction: 'right',
    queuedDirection: null,
    food: createFoodPosition(boardWidth, boardHeight, snake, randomSource),
    score: 0,
    status: 'running',
  };
};

export const queueSnakeDirection = (
  state: SnakeGameState,
  nextDirection: SnakeDirection
): SnakeGameState => {
  if (state.status === 'game-over') {
    return state;
  }

  if (state.queuedDirection) {
    return state;
  }

  if (OPPOSITE_DIRECTIONS[state.direction] === nextDirection) {
    return state;
  }

  if (state.direction === nextDirection) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  };
};

export const toggleSnakePause = (state: SnakeGameState): SnakeGameState => {
  if (state.status === 'game-over') {
    return state;
  }

  return {
    ...state,
    status: state.status === 'paused' ? 'running' : 'paused',
  };
};

export const restartSnakeGame = (
  state: SnakeGameState,
  randomSource: RandomSource = Math.random
): SnakeGameState =>
  createSnakeGameState(
    {
      boardWidth: state.boardWidth,
      boardHeight: state.boardHeight,
    },
    randomSource
  );

export const stepSnakeGame = (
  state: SnakeGameState,
  randomSource: RandomSource = Math.random
): SnakeGameState => {
  if (state.status !== 'running' || state.snake.length === 0) {
    return state;
  }

  const direction = state.queuedDirection ?? state.direction;
  const head = state.snake[0];
  const vector = DIRECTION_VECTORS[direction];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };

  const hitsBoundary =
    nextHead.x < 0 ||
    nextHead.x >= state.boardWidth ||
    nextHead.y < 0 ||
    nextHead.y >= state.boardHeight;

  if (hitsBoundary) {
    return {
      ...state,
      direction,
      queuedDirection: null,
      status: 'game-over',
    };
  }

  const ateFood = state.food !== null && positionsMatch(nextHead, state.food);
  const collisionSegments = ateFood ? state.snake : state.snake.slice(0, -1);
  const hitsSelf = collisionSegments.some((segment) => positionsMatch(segment, nextHead));

  if (hitsSelf) {
    return {
      ...state,
      direction,
      queuedDirection: null,
      status: 'game-over',
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!ateFood) {
    nextSnake.pop();
  }

  const nextFood = ateFood
    ? createFoodPosition(state.boardWidth, state.boardHeight, nextSnake, randomSource)
    : state.food;
  const nextStatus = ateFood && nextFood === null ? 'game-over' : state.status;

  return {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: null,
    food: nextFood,
    score: state.score + (ateFood ? 1 : 0),
    status: nextStatus,
  };
};
