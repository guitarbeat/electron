import test from 'node:test';
import assert from 'node:assert/strict';
import { computeActionFanPositions } from './actionFanLayout.ts';

test('computeActionFanPositions', async (t) => {
  await t.test('keeps the quick actions visible near the bottom-left corner', () => {
    const positions = computeActionFanPositions({
      count: 7,
      anchorX: 18,
      anchorY: 526,
      anchorSize: 64,
      viewportWidth: 620,
      viewportHeight: 618,
    });

    assert.equal(positions.length, 7);

    positions.forEach((position) => {
      assert.ok(position.x >= 72, `expected x >= 72, got ${position.x}`);
      assert.ok(position.x <= 548, `expected x <= 548, got ${position.x}`);
      assert.ok(position.y >= 46, `expected y >= 46, got ${position.y}`);
      assert.ok(position.y <= 542, `expected y <= 542, got ${position.y}`);
      assert.ok(position.x > 50, `expected bubble to stay off the left edge, got ${position.x}`);
      assert.ok(position.y < 558, `expected bubble to stay above the bottom edge, got ${position.y}`);
    });
  });

  await t.test('leans the quick actions toward open space near the bottom-left corner', () => {
    const anchorX = 18;
    const anchorY = 526;
    const anchorSize = 64;
    const anchorCenterX = anchorX + anchorSize / 2;
    const anchorCenterY = anchorY + anchorSize / 2;

    const positions = computeActionFanPositions({
      count: 7,
      anchorX,
      anchorY,
      anchorSize,
      viewportWidth: 620,
      viewportHeight: 618,
    });

    positions.forEach((position) => {
      assert.ok(position.x >= anchorCenterX, `expected x to fan rightward, got ${position.x}`);
      assert.ok(position.y <= anchorCenterY, `expected y to fan upward, got ${position.y}`);
    });
  });

  await t.test('keeps the quick actions visible near the bottom-right corner', () => {
    const positions = computeActionFanPositions({
      count: 7,
      anchorX: 538,
      anchorY: 526,
      anchorSize: 64,
      viewportWidth: 620,
      viewportHeight: 618,
    });

    positions.forEach((position) => {
      assert.ok(position.x >= 72, `expected x >= 72, got ${position.x}`);
      assert.ok(position.x <= 548, `expected x <= 548, got ${position.x}`);
      assert.ok(position.y >= 46, `expected y >= 46, got ${position.y}`);
      assert.ok(position.y <= 542, `expected y <= 542, got ${position.y}`);
    });
  });
});
