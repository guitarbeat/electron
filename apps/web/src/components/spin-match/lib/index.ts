import { getUnwatchedCandidatePool } from "../../games/movieCandidatePool";

export const MIN_SPIN_SUBSET_SIZE = 1;

export const canSpinFromSubset = (keptCount: number): boolean =>
  keptCount >= MIN_SPIN_SUBSET_SIZE;

export const getSpinSubsetPrompt = (
  keptCount: number,
  isDone: boolean,
): string => {
  if (keptCount <= 0) {
    return "Keep at least one movie to spin a subset.";
  }

  if (isDone) {
    return `Spin the ${keptCount}-movie subset you picked.`;
  }

  return "You can stop rating now. The wheel only uses the movies you kept.";
};

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
  lastTime: number | null,
): number {
  if (lastX === null || lastTime === null) return 0;
  const dt = currentTime - lastTime;
  if (dt <= 0) return 0;
  return (currentX - lastX) / dt;
}

export function filterCandidates<T extends { watchedBy: unknown[] }>(movies: T[]): T[] {
  return getUnwatchedCandidatePool(movies);
}
