export interface RadialMenuMetrics {
  fanRadius: number;
  safeMargin: number;
  toggleOffset: number;
}

export interface RadialMenuViewport {
  chromeTop?: number;
  height: number;
  insetBottom?: number;
  insetLeft?: number;
  insetRight?: number;
  insetTop?: number;
  offsetLeft?: number;
  offsetTop?: number;
  width: number;
}

export const MOBILE_BREAKPOINT = 768;

export const RADIAL_MENU_DESKTOP_METRICS: RadialMenuMetrics = {
  fanRadius: 110,
  safeMargin: 10,
  toggleOffset: 100,
};

export const RADIAL_MENU_MOBILE_METRICS: RadialMenuMetrics = {
  fanRadius: 90,
  safeMargin: 10,
  toggleOffset: 80,
};

export const getRadialMenuMetricsForWidth = (width: number): RadialMenuMetrics =>
  width <= MOBILE_BREAKPOINT ? RADIAL_MENU_MOBILE_METRICS : RADIAL_MENU_DESKTOP_METRICS;

export const getDockedPositionForViewport = (
  viewport: RadialMenuViewport,
  metrics: RadialMenuMetrics
) => {
  const offsetLeft = viewport.offsetLeft ?? 0;
  const offsetTop = viewport.offsetTop ?? 0;
  const insetRight = viewport.insetRight ?? 0;
  const insetBottom = viewport.insetBottom ?? 0;

  return {
    x:
      offsetLeft +
      viewport.width -
      metrics.toggleOffset -
      metrics.fanRadius -
      metrics.safeMargin -
      insetRight,
    y:
      offsetTop +
      viewport.height -
      metrics.toggleOffset -
      metrics.fanRadius -
      metrics.safeMargin -
      insetBottom,
  };
};

export const clampPositionToViewport = (
  position: { x: number; y: number },
  viewport: RadialMenuViewport,
  metrics: RadialMenuMetrics
) => {
  const offsetLeft = viewport.offsetLeft ?? 0;
  const offsetTop = viewport.offsetTop ?? 0;
  const insetLeft = viewport.insetLeft ?? 0;
  const insetTop = viewport.insetTop ?? 0;
  const insetRight = viewport.insetRight ?? 0;
  const insetBottom = viewport.insetBottom ?? 0;
  const chromeTop = viewport.chromeTop ?? 0;

  const minX = offsetLeft + insetLeft + metrics.safeMargin - metrics.toggleOffset + metrics.fanRadius;
  const maxX =
    offsetLeft +
    viewport.width -
    metrics.toggleOffset -
    metrics.fanRadius -
    metrics.safeMargin -
    insetRight;
  const minY =
    offsetTop + Math.max(insetTop, chromeTop) + metrics.safeMargin - metrics.toggleOffset + metrics.fanRadius;
  const maxY =
    offsetTop +
    viewport.height -
    metrics.toggleOffset -
    metrics.fanRadius -
    metrics.safeMargin -
    insetBottom;

  return {
    x: Math.min(Math.max(position.x, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(position.y, minY), Math.max(minY, maxY)),
  };
};
