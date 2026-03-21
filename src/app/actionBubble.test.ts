import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTION_BUBBLE_EDGE_MARGIN,
  ACTION_BUBBLE_SIZE,
  clampActionBubblePosition,
  getActionBubbleMenuPosition,
  getDefaultActionBubblePosition,
  snapActionBubbleToEdge,
} from './actionBubble.ts';

test('clampActionBubblePosition', async (t) => {
  await t.test('keeps the bubble inside the viewport bounds', () => {
    const position = clampActionBubblePosition(-100, 2000, 390, 844);

    assert.equal(position.x, ACTION_BUBBLE_EDGE_MARGIN);
    assert.equal(position.y, 844 - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN);
  });
});

test('getDefaultActionBubblePosition', async (t) => {
  await t.test('starts near the lower left on desktop', () => {
    const position = getDefaultActionBubblePosition(1440, 900, false);

    assert.equal(position.x, ACTION_BUBBLE_EDGE_MARGIN + 6);
    assert.equal(position.y, 900 - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN - 6);
  });

  await t.test('starts near the lower right on mobile', () => {
    const position = getDefaultActionBubblePosition(390, 844, true);

    assert.equal(position.x, 390 - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN);
    assert.equal(position.y, 844 - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN - 6);
  });
});

test('getActionBubbleMenuPosition', async (t) => {
  await t.test('opens below the bubble when there is enough space', () => {
    const menuPosition = getActionBubbleMenuPosition({ x: 24, y: 400 }, 1280, 900);

    assert.equal(menuPosition.left, '12px');
    assert.equal(menuPosition.top, '472px');
  });

  await t.test('opens above the bubble when there is not enough space below', () => {
    const menuPosition = getActionBubbleMenuPosition({ x: 320, y: 720 }, 390, 844);

    assert.equal(menuPosition.left, '118px');
    assert.equal(menuPosition.top, '448px');
  });
});

test('snapActionBubbleToEdge', async (t) => {
  await t.test('snaps to the nearest horizontal edge while keeping the current y position', () => {
    const left = snapActionBubbleToEdge({ x: 90, y: 500 }, 1280, 900);
    const right = snapActionBubbleToEdge({ x: 1080, y: 500 }, 1280, 900);

    assert.equal(left.x, ACTION_BUBBLE_EDGE_MARGIN);
    assert.equal(left.y, 500);
    assert.equal(right.x, 1280 - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN);
    assert.equal(right.y, 500);
  });
});
