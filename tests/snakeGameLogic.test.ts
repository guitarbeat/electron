import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGameState,
  enqueueDirection,
  stepGame,
  type SnakeGameState,
} from '../src/components/snake/snakeGameLogic.ts';

test('createInitialGameState creates valid board state and food placement', () => {
  const state = createInitialGameState({ width: 8, height: 8 }, () => 0);

  assert.equal(state.width, 8);
  assert.equal(state.height, 8);
  assert.equal(state.score, 0);
  assert.equal(state.status, 'running');
  assert.ok(state.snake.length >= 2);

  const foodOnSnake = state.snake.some(
    (segment) => segment.x === state.food.x && segment.y === state.food.y
  );
  assert.equal(foodOnSnake, false);
});

test('enqueueDirection ignores opposite direction changes', () => {
  const initial = createInitialGameState({ width: 10, height: 10 });
  const next = enqueueDirection(initial, 'left');

  assert.equal(next.queuedDirection, 'right');
  assert.equal(next.direction, 'right');
});

test('stepGame increments score and keeps running when snake eats food', () => {
  const state: SnakeGameState = {
    width: 6,
    height: 6,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
    direction: 'right',
    queuedDirection: 'right',
    food: { x: 3, y: 2 },
    score: 0,
    status: 'running',
  };

  const next = stepGame(state, () => 0);

  assert.equal(next.score, 1);
  assert.equal(next.status, 'running');
  assert.equal(next.snake.length, 4);
  assert.deepEqual(next.snake[0], { x: 3, y: 2 });
});

test('stepGame sets game-over on wall collision', () => {
  const state: SnakeGameState = {
    width: 4,
    height: 4,
    snake: [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
    ],
    direction: 'right',
    queuedDirection: 'right',
    food: { x: 0, y: 0 },
    score: 2,
    status: 'running',
  };

  const next = stepGame(state);
  assert.equal(next.status, 'game-over');
});
