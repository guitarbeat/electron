import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFoodPosition,
  createSnakeGameState,
  queueSnakeDirection,
  restartSnakeGame,
  stepSnakeGame,
  toggleSnakePause,
  type SnakeGameState,
} from './snakeEngine.ts';

const createState = (overrides: Partial<SnakeGameState> = {}): SnakeGameState => ({
  boardWidth: 5,
  boardHeight: 5,
  snake: [
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
  ],
  direction: 'right',
  queuedDirection: null,
  food: { x: 4, y: 4 },
  score: 0,
  status: 'running',
  ...overrides,
});

test('createSnakeGameState', async (t) => {
  await t.test('creates a centered snake and food on an empty cell', () => {
    const state = createSnakeGameState({ boardWidth: 6, boardHeight: 6 }, () => 0);

    assert.deepEqual(state.snake, [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
    ]);
    assert.deepEqual(state.food, { x: 0, y: 0 });
    assert.equal(state.score, 0);
    assert.equal(state.status, 'running');
  });
});

test('queueSnakeDirection', async (t) => {
  await t.test('queues a legal direction change', () => {
    const state = queueSnakeDirection(createState(), 'up');

    assert.equal(state.queuedDirection, 'up');
  });

  await t.test('rejects an immediate reverse direction', () => {
    const state = queueSnakeDirection(createState(), 'left');

    assert.equal(state.queuedDirection, null);
  });
});

test('stepSnakeGame', async (t) => {
  await t.test('moves the snake forward without changing length', () => {
    const state = stepSnakeGame(createState());

    assert.deepEqual(state.snake, [
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ]);
    assert.equal(state.score, 0);
    assert.equal(state.status, 'running');
  });

  await t.test('grows and increments score when food is eaten', () => {
    const state = stepSnakeGame(
      createState({
        food: { x: 3, y: 2 },
      }),
      () => 0
    );

    assert.deepEqual(state.snake, [
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ]);
    assert.equal(state.score, 1);
    assert.deepEqual(state.food, { x: 0, y: 0 });
  });

  await t.test('ends the game when the head hits a boundary', () => {
    const state = stepSnakeGame(
      createState({
        snake: [
          { x: 4, y: 1 },
          { x: 3, y: 1 },
          { x: 2, y: 1 },
        ],
      })
    );

    assert.equal(state.status, 'game-over');
  });

  await t.test('ends the game on self collision', () => {
    const state = stepSnakeGame(
      createState({
        snake: [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 3, y: 1 },
          { x: 2, y: 1 },
          { x: 1, y: 1 },
          { x: 1, y: 2 },
        ],
        direction: 'left',
        queuedDirection: 'up',
      })
    );

    assert.equal(state.status, 'game-over');
  });
});

test('createFoodPosition', async (t) => {
  await t.test('chooses from the remaining open cells deterministically', () => {
    const food = createFoodPosition(
      3,
      3,
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
      ],
      () => 0.4
    );

    assert.deepEqual(food, { x: 0, y: 2 });
  });

  await t.test('returns null when the board is full', () => {
    const food = createFoodPosition(
      2,
      2,
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      () => 0
    );

    assert.equal(food, null);
  });
});

test('toggleSnakePause', async (t) => {
  await t.test('switches between paused and running', () => {
    const paused = toggleSnakePause(createState());
    const resumed = toggleSnakePause(paused);

    assert.equal(paused.status, 'paused');
    assert.equal(resumed.status, 'running');
  });
});

test('restartSnakeGame', async (t) => {
  await t.test('resets score, snake, and status while keeping the board size', () => {
    const restarted = restartSnakeGame(
      createState({
        boardWidth: 8,
        boardHeight: 6,
        score: 4,
        status: 'game-over',
      }),
      () => 0
    );

    assert.equal(restarted.boardWidth, 8);
    assert.equal(restarted.boardHeight, 6);
    assert.equal(restarted.score, 0);
    assert.equal(restarted.status, 'running');
    assert.deepEqual(restarted.snake, [
      { x: 4, y: 3 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
    ]);
  });
});
