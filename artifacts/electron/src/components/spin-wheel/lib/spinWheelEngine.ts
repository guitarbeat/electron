import type { Movie } from "@/shared/types";

const SEGMENT_COLORS = [
  "#ff7ea8",
  "#6ad6ff",
  "#ffd166",
  "#7ee08c",
  "#c7a0ff",
  "#ff9f68",
];
export const SPIN_HISTORY_MAX = 10;
const SPIN_TURNS = 6;

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

  const queue = movies.filter((movie) => movie.watchedBy.length < 2);
  return queue.length > 0 ? queue : movies;
};

export const getSpinPool = (
  movies: Movie[],
  mode: SpinMode,
  selectedMovieIds: ReadonlySet<string> = new Set<string>(),
): Movie[] => {
  const candidates = getSpinCandidates(movies, mode);
  if (selectedMovieIds.size === 0) {
    return candidates;
  }

  const selected = candidates.filter((movie) => selectedMovieIds.has(movie.id));
  return selected.length > 0 ? selected : candidates;
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

export const appendSpinHistory = (
  history: string[],
  title: string,
  maxEntries: number = SPIN_HISTORY_MAX,
): string[] => [title, ...history].slice(0, maxEntries);

const secureRandom = () => {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / 4294967296;
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
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

  return {
    targetIndex,
    nextRotation: currentRotation + 360 * SPIN_TURNS + normalizedTarget,
    winner: candidates[targetIndex],
  };
};
