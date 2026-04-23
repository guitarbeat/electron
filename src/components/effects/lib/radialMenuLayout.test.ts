import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MOBILE_BREAKPOINT,
  clampPositionToViewport,
  getDockedPositionForViewport,
  getRadialMenuMetricsForWidth,
} from './radialMenuLayout.ts';

test('uses compact radial-menu geometry through the CSS mobile breakpoint', () => {
  const compactMetrics = getRadialMenuMetricsForWidth(MOBILE_BREAKPOINT);
  const tabletMetrics = getRadialMenuMetricsForWidth(700);
  const desktopMetrics = getRadialMenuMetricsForWidth(1024);

  assert.equal(compactMetrics.toggleOffset, 80);
  assert.equal(tabletMetrics.toggleOffset, 80);
  assert.equal(desktopMetrics.toggleOffset, 100);
});

test('docked position keeps the menu inside the viewport with safe-area insets', () => {
  const metrics = getRadialMenuMetricsForWidth(700);
  const docked = getDockedPositionForViewport(
    {
      width: 700,
      height: 900,
      insetRight: 18,
      insetBottom: 24,
    },
    metrics
  );

  assert.deepEqual(docked, {
    x: 502,
    y: 696,
  });
});

test('clamping matches compact geometry instead of desktop offsets', () => {
  const metrics = getRadialMenuMetricsForWidth(700);
  const clamped = clampPositionToViewport(
    { x: -999, y: -999 },
    {
      width: 700,
      height: 900,
      insetLeft: 12,
      insetTop: 8,
    },
    metrics
  );

  assert.deepEqual(clamped, {
    x: 32,
    y: 28,
  });
});
