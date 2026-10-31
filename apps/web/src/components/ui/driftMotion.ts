/** About 20 paints per second. Enough for the belt to read as motion on a Fire TV Stick. */
export const TV_DRIFT_FRAME_MS = 48;

export function shouldWriteDriftFrame(
  now: number,
  lastWrite: number,
  intervalMs: number,
): boolean {
  if (intervalMs <= 0) return true;
  return lastWrite === 0 || now - lastWrite >= intervalMs;
}
