import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialGameState,
  enqueueDirection,
  generateFoodPosition,
  stepGame,
} from './snakeGameLogic.ts';
import type { SnakeGameState } from './snakeGameLogic.ts';

function createBaseState(overrides: Partial<SnakeGameState> = {}): SnakeGameState {
  return {
    width: 8,
    height: 8,
    snake: [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
    ],
    direction: 'right',
    queuedDirection: 'right',
    food: { x: 0, y: 0 },
    score: 0,
    status: 'running',
    ...overrides,
  };
}

test('stepGame moves snake one cell forward when no food is eaten', () => {
  const initialState = createBaseState();
  const nextState = stepGame(initialState);

  assert.deepEqual(nextState.snake, [
    { x: 4, y: 3 },
    { x: 3, y: 3 },
    { x: 2, y: 3 },
  ]);
  assert.equal(nextState.score, 0);
  assert.equal(nextState.status, 'running');
});

test('stepGame grows snake and increments score when food is eaten', () => {
  const initialState = createBaseState({ food: { x: 4, y: 3 } });
  const nextState = stepGame(initialState, () => 0);

  assert.equal(nextState.snake.length, 4);
  assert.equal(nextState.score, 1);
  assert.equal(nextState.status, 'running');
  assert(
    !nextState.snake.some(
      (segment) => segment.x === nextState.food.x && segment.y === nextState.food.y
    )
  );
});

test('stepGame sets game-over when snake hits wall boundary', () => {
  const initialState = createBaseState({
    width: 5,
    snake: [
      { x: 4, y: 3 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
    ],
  });

  const nextState = stepGame(initialState);

  assert.equal(nextState.status, 'game-over');
});

test('stepGame sets game-over when snake collides with itself', () => {
  const initialState = createBaseState({
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
    ],
    direction: 'up',
    queuedDirection: 'up',
    food: { x: 7, y: 7 },
  });

  const nextState = stepGame(initialState);

  assert.equal(nextState.status, 'game-over');
});

test('generateFoodPosition returns only free cells', () => {
  const occupiedCells = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ];

  const nextFood = generateFoodPosition(3, 2, occupiedCells, () => 0.4);

  assert.deepEqual(nextFood, { x: 2, y: 1 });
});

test('enqueueDirection blocks opposite turns and only accepts one queued turn per tick', () => {
  const initialState = createBaseState();

  const oppositeTurn = enqueueDirection(initialState, 'left');
  assert.equal(oppositeTurn.queuedDirection, 'right');

  const queuedTurn = enqueueDirection(initialState, 'up');
  assert.equal(queuedTurn.queuedDirection, 'up');

  const secondQueuedTurn = enqueueDirection(queuedTurn, 'left');
  assert.equal(secondQueuedTurn.queuedDirection, 'up');
});

test('createInitialGameState places food away from initial snake', () => {
  const initialState = createInitialGameState({ width: 10, height: 10 }, () => 0);

  assert.equal(initialState.status, 'running');
  assert(
    !initialState.snake.some(
      (segment) => segment.x === initialState.food.x && segment.y === initialState.food.y
    )
  );
});
