import type { Movie } from "@/shared/types";
import {
  getUnwatchedCandidatePool,
  selectCandidateSubset,
} from "../games/movieCandidatePool";

export const SEGMENT_COLORS = [
  "#ff7ea8",
  "#6ad6ff",
  "#ffd166",
  "#7ee08c",
  "#c7a0ff",
  "#ff9f68",
];
export const SPIN_TURNS = 6;

export type SpinMode = "queue" | "all";

export interface SpinOutcome {
  targetIndex: number;
  nextRotation: number;
  winner: Movie;
}

export const getSpinCandidates = (movies: Movie[], mode: SpinMode): Movie[] => {
  if (mode === "all") {
    return movies;
  }

  return getUnwatchedCandidatePool(movies);
};

export const getSpinPool = (
  movies: Movie[],
  mode: SpinMode,
  selectedMovieIds: ReadonlySet<string> = new Set<string>(),
): Movie[] => {
  const candidates = getSpinCandidates(movies, mode);
  return selectCandidateSubset(candidates, selectedMovieIds);
};

export const buildSpinWheelGradient = (
  segmentCount: number,
  segmentColors: readonly string[] = SEGMENT_COLORS,
): string => {
  if (segmentCount <= 0) {
    return "conic-gradient(#444, #222)";
  }

  const step = 360 / segmentCount;
  const parts = Array.from({ length: segmentCount }, (_, index) => {
    const start = Math.round(index * step);
    const end = Math.round((index + 1) * step);
    return `${segmentColors[index % segmentColors.length]} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${parts.join(", ")})`;
};

const secureRandom = () => {
  const cryptoObj =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const array = new Uint32Array(1);
    cryptoObj.getRandomValues(array);
    return array[0] / 4294967296;
  }
  throw new Error(
    "Secure random number generation is not supported in this environment.",
  );
};

export const computeSpinOutcome = (
  candidates: Movie[],
  currentRotation: number,
  randomSource: () => number = secureRandom,
): SpinOutcome | null => {
  if (candidates.length === 0) {
    return null;
  }

  const targetIndex = Math.min(
    candidates.length - 1,
    Math.max(0, Math.floor(randomSource() * candidates.length)),
  );
  const step = 360 / candidates.length;
  const targetCenterDeg = targetIndex * step + step / 2;
  const normalizedTarget = (360 - targetCenterDeg + 360) % 360;

  // Calculate forward rotation delta required from current position to reach normalizedTarget
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let forwardDelta = (normalizedTarget - currentMod) % 360;
  if (forwardDelta <= 0) forwardDelta += 360;

  return {
    targetIndex,
    nextRotation: currentRotation + 360 * SPIN_TURNS + forwardDelta,
    winner: candidates[targetIndex],
  };
};
