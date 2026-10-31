/**
 * TV paints the belt every animation frame, like desktop. The writes are transform-only on
 * already-composited tiles, so they are cheap; the old 48 ms (about 20 fps) cap made the wall
 * judder on Fire TV. The browser still drops frames by itself if the device falls behind.
 */
export const TV_DRIFT_FRAME_MS = 0;

export function shouldWriteDriftFrame(
  now: number,
  lastWrite: number,
  intervalMs: number,
): boolean {
  if (intervalMs <= 0) return true;
  return lastWrite === 0 || now - lastWrite >= intervalMs;
}
