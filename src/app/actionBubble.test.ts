import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTION_BUBBLE_DOCK_GAP,
  ACTION_BUBBLE_EDGE_MARGIN,
  ACTION_BUBBLE_EDGE_MARGIN_MOBILE,
  ACTION_BUBBLE_SIZE,
  ACTION_BUBBLE_SIZE_MOBILE,
  ACTION_BUBBLE_TOGGLE_OUTER_HEIGHT,
  ACTION_BUBBLE_TOGGLE_OUTER_WIDTH,
  ACTION_BUBBLE_TOGGLE_OUTER_WIDTH_COMPACT,
  ACTION_BUBBLE_TOGGLE_OVERLAP,
  clampActionBubblePosition,
  getDockedActionBubblePosition,
  getActionBubbleMenuPosition,
  getActionBubbleTogglePosition,
  getDefaultActionBubblePosition,
  snapActionBubbleToEdge,
} from './actionBubble.ts';

test('clampActionBubblePosition', async (t) => {
  await t.test('keeps the bubble inside the viewport bounds (mobile metrics)', () => {
    const position = clampActionBubblePosition(-100, 2000, 390, 844, true);

    assert.equal(position.x, ACTION_BUBBLE_EDGE_MARGIN_MOBILE);
    assert.equal(position.y, 844 - ACTION_BUBBLE_SIZE_MOBILE - ACTION_BUBBLE_EDGE_MARGIN_MOBILE);
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

    assert.equal(position.x, 390 - ACTION_BUBBLE_SIZE_MOBILE - ACTION_BUBBLE_EDGE_MARGIN_MOBILE);
    assert.equal(position.y, 844 - ACTION_BUBBLE_SIZE_MOBILE - ACTION_BUBBLE_EDGE_MARGIN_MOBILE - 6);
  });
});

test('getActionBubbleMenuPosition', async (t) => {
  await t.test('opens below the bubble when there is enough space', () => {
    const menuPosition = getActionBubbleMenuPosition({ x: 24, y: 400 }, 1280, 900, false);

    assert.equal(menuPosition.left, '12px');
    assert.equal(menuPosition.top, '488px');
  });

  await t.test('opens above the bubble when there is not enough space below', () => {
    const menuPosition = getActionBubbleMenuPosition({ x: 320, y: 720 }, 390, 844, false);

    assert.equal(menuPosition.left, '118px');
    assert.equal(menuPosition.top, '448px');
  });
});

test('snapActionBubbleToEdge', async (t) => {
  await t.test('snaps to the nearest horizontal edge while keeping the current y position', () => {
    const left = snapActionBubbleToEdge({ x: 90, y: 500 }, 1280, 900, false);
    const right = snapActionBubbleToEdge({ x: 1080, y: 500 }, 1280, 900, false);

    assert.equal(left.x, ACTION_BUBBLE_EDGE_MARGIN);
    assert.equal(left.y, 500);
    assert.equal(right.x, 1280 - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN);
    assert.equal(right.y, 500);
  });
});

test('getDockedActionBubblePosition', async (t) => {
  await t.test('docks to the right of the workspace control when there is room', () => {
    const position = getDockedActionBubblePosition(
      { left: 40, top: 230, width: 240, height: 52 },
      1280,
      900
    );

    assert.equal(position.x, 40 + 240 + ACTION_BUBBLE_DOCK_GAP);
    assert.equal(position.y, 230 + (52 - ACTION_BUBBLE_SIZE) / 2);
  });

  await t.test('falls back to docking on the left when there is no room on the right', () => {
    const position = getDockedActionBubblePosition(
      { left: 270, top: 230, width: 240, height: 52 },
      560,
      900
    );

    assert.equal(position.x, 270 - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_DOCK_GAP);
    assert.equal(position.y, 230 + (52 - ACTION_BUBBLE_SIZE) / 2);
  });
});

test('getActionBubbleTogglePosition', async (t) => {
  await t.test('docks the toggle to the left of the bubble when there is room', () => {
    const position = getActionBubbleTogglePosition({ x: 500, y: 300 }, 1280, 900, false);

    assert.equal(
      position.left,
      `${500 - ACTION_BUBBLE_TOGGLE_OUTER_WIDTH + ACTION_BUBBLE_TOGGLE_OVERLAP}px`
    );
    assert.equal(
      position.top,
      `${300 + (ACTION_BUBBLE_SIZE - ACTION_BUBBLE_TOGGLE_OUTER_HEIGHT) / 2}px`
    );
  });

  await t.test('falls back to the right of the bubble when there is no room on the left', () => {
    const position = getActionBubbleTogglePosition({ x: 24, y: 300 }, 1280, 900, false);

    assert.equal(position.left, `${24 + ACTION_BUBBLE_SIZE - ACTION_BUBBLE_TOGGLE_OVERLAP}px`);
  });

  await t.test('clamps compact toggle inside the viewport', () => {
    const position = getActionBubbleTogglePosition({ x: 8, y: 4 }, 390, 844, true);

    assert.equal(position.left, `${8 + ACTION_BUBBLE_SIZE_MOBILE - ACTION_BUBBLE_TOGGLE_OVERLAP}px`);
    assert.equal(position.top, `${ACTION_BUBBLE_EDGE_MARGIN_MOBILE}px`);
    assert.ok(Number.parseInt(position.left, 10) <= 390 - ACTION_BUBBLE_TOGGLE_OUTER_WIDTH_COMPACT);
  });
});
