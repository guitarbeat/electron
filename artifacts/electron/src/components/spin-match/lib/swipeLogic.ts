export const SWIPE_THRESHOLD = 75;
export const SWIPE_VELOCITY_THRESHOLD = 0.4;

export type SwipeResult = "keep" | "skip" | "none";

export function evaluateSwipe(finalX: number, velocity: number): SwipeResult {
  if (finalX > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
    return "keep";
  }
  if (finalX < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY_THRESHOLD) {
    return "skip";
  }
  return "none";
}

export function calculateVelocity(
  currentX: number,
  lastX: number | null,
  currentTime: number,
  lastTime: number | null
): number {
  if (lastX === null || lastTime === null) return 0;
  const dt = currentTime - lastTime;
  if (dt <= 0) return 0;
  return (currentX - lastX) / dt;
}

export function filterCandidates<T extends { watchedBy: unknown[] }>(movies: T[]): T[] {
  return getUnwatchedCandidatePool(movies);
}
import { getUnwatchedCandidatePool } from "../../games/movieCandidatePool";
