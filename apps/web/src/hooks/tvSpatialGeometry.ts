export type Direction = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
export interface FocusRect { left: number; top: number; right: number; bottom: number; }

/** Prefer a control in the same row/column before a diagonally closer control. */
export function spatialScore(from: FocusRect, to: FocusRect, direction: Direction): number {
  const horizontal = direction === "ArrowLeft" || direction === "ArrowRight";
  const forward = direction === "ArrowRight" || direction === "ArrowDown" ? 1 : -1;
  const fromMain = horizontal ? (from.left + from.right) / 2 : (from.top + from.bottom) / 2;
  const toMain = horizontal ? (to.left + to.right) / 2 : (to.top + to.bottom) / 2;
  const distance = (toMain - fromMain) * forward;
  if (distance < 4) return Infinity;
  const fromStart = horizontal ? from.top : from.left;
  const fromEnd = horizontal ? from.bottom : from.right;
  const toStart = horizontal ? to.top : to.left;
  const toEnd = horizontal ? to.bottom : to.right;
  const crossGap = Math.max(0, toStart - fromEnd, fromStart - toEnd);
  const crossCenter = Math.abs((toStart + toEnd - fromStart - fromEnd) / 2);
  return distance + crossCenter * 2 + (crossGap > 0 ? 10000 + crossGap * 4 : 0);
}
