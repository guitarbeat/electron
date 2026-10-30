import type { Movie, User } from "@/shared/types";

export type MovieFormatFilter = "all" | "movie" | "series" | "youtube";
export type MovieProgressFilter = "all" | "unwatched" | "watching" | "watched";
export type MovieAddedByFilter = "all" | User;
export type MovieStatusPreset = "all" | "queue" | "both_watched" | "in_progress";
export type MovieSortOrder = "recent" | "alpha" | "genre" | "rating";

export interface MovieWallFilterState {
  format: MovieFormatFilter;
  genre: string;
  Aaron: MovieProgressFilter;
  Electra: MovieProgressFilter;
  addedBy: MovieAddedByFilter;
  query?: string;
  statusPreset?: MovieStatusPreset;
  sortBy?: MovieSortOrder;
}

export const DEFAULT_MOVIE_WALL_FILTERS: MovieWallFilterState = {
  format: "all",
  genre: "all",
  Aaron: "all",
  Electra: "all",
  addedBy: "all",
  query: "",
  statusPreset: "all",
  sortBy: "recent",
};

export const splitGenres = (genre?: string): string[] =>
  (genre ?? "")
    .split(/[,/|;]+/)
    .map((value) => value.trim())
    .filter(Boolean);

export const isTvSeriesItem = (movie: Partial<Movie>): boolean => {
  if (movie.mediaType === "series") return true;
  if (movie.mediaType === "movie") return false;

  const cat = movie.category?.toLowerCase() ?? "";
  if (cat.includes("series") || cat.includes("tv")) return true;

  const runtime = movie.runtime?.toLowerCase() ?? "";
  if (runtime.includes("season") || runtime.includes("ep")) return true;

  if (movie.year && /\d{4}\s*[–-]\s*(\d{4})?/.test(movie.year)) return true;

  return false;
};

export const isYouTubeItem = (movie: Partial<Movie>): boolean => {
  if (movie.mediaType === "youtube") return true;
  if (movie.youtubeUrl) return true;
  const cat = movie.category?.toLowerCase() ?? "";
  if (cat.includes("youtube")) return true;
  return false;
};

export const getMovieWallGenres = (movies: Movie[]): string[] =>
  [...new Set(movies.flatMap((movie) => splitGenres(movie.genre)))].sort((a, b) =>
    a.localeCompare(b),
  );

export interface GenreCount {
  genre: string;
  count: number;
}

export const getMovieWallGenreCounts = (movies: Movie[]): GenreCount[] => {
  const counts = new Map<string, number>();
  for (const movie of movies) {
    const genres = splitGenres(movie.genre);
    for (const g of genres) {
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
};

export const hasActiveMovieWallFilters = (
  filters: MovieWallFilterState,
): boolean =>
  filters.format !== "all" ||
  filters.genre !== "all" ||
  filters.Aaron !== "all" ||
  filters.Electra !== "all" ||
  filters.addedBy !== "all" ||
  Boolean(filters.query?.trim()) ||
  Boolean(filters.statusPreset && filters.statusPreset !== "all");

export const getActiveFilterCount = (filters: MovieWallFilterState): number => {
  let count = 0;
  if (filters.format !== "all") count++;
  if (filters.genre !== "all") count++;
  if (filters.Aaron !== "all") count++;
  if (filters.Electra !== "all") count++;
  if (filters.addedBy !== "all") count++;
  if (filters.query?.trim()) count++;
  if (filters.statusPreset && filters.statusPreset !== "all") count++;
  return count;
};

const PROGRESS_CYCLE_ORDER: readonly MovieProgressFilter[] = [
  "all",
  "unwatched",
  "watching",
  "watched",
];

export const cycleProgressFilter = (
  current: MovieProgressFilter,
): MovieProgressFilter => {
  const index = PROGRESS_CYCLE_ORDER.indexOf(current);
  if (index === -1) return "unwatched";
  return PROGRESS_CYCLE_ORDER[(index + 1) % PROGRESS_CYCLE_ORDER.length];
};

export interface MovieWallOptionCounts {
  total: number;
  formats: Record<MovieFormatFilter, number>;
  presets: Record<MovieStatusPreset, number>;
  viewers: Record<User, Record<MovieProgressFilter, number>>;
  addedBy: Record<MovieAddedByFilter, number>;
}

export const getMovieWallOptionCounts = (
  movies: Movie[],
): MovieWallOptionCounts => {
  const counts: MovieWallOptionCounts = {
    total: movies.length,
    formats: {
      all: movies.length,
      movie: 0,
      series: 0,
      youtube: 0,
    },
    presets: {
      all: movies.length,
      queue: 0,
      in_progress: 0,
      both_watched: 0,
    },
    viewers: {
      Aaron: {
        all: movies.length,
        unwatched: 0,
        watching: 0,
        watched: 0,
      },
      Electra: {
        all: movies.length,
        unwatched: 0,
        watching: 0,
        watched: 0,
      },
    },
    addedBy: {
      all: movies.length,
      Aaron: 0,
      Electra: 0,
    },
  };

  for (const movie of movies) {
    const isTv = isTvSeriesItem(movie);
    const isYt = isYouTubeItem(movie);
    if (isTv) counts.formats.series++;
    if (isYt) counts.formats.youtube++;
    if (!isTv && !isYt) counts.formats.movie++;

    const watchedCount = movie.watchedBy.length;
    const isAnyWatching = (movie.watchingBy?.length ?? 0) > 0;
    if (watchedCount === 0 && !isAnyWatching) counts.presets.queue++;
    if (isAnyWatching) counts.presets.in_progress++;
    if (watchedCount >= 2) counts.presets.both_watched++;

    for (const user of ["Aaron", "Electra"] as const) {
      const isWatched = movie.watchedBy.some(
        (u) => u.toLowerCase() === user.toLowerCase(),
      );
      const isWatching = (movie.watchingBy ?? []).some(
        (u) => u.toLowerCase() === user.toLowerCase(),
      );
      if (isWatched) {
        counts.viewers[user].watched++;
      } else if (isWatching) {
        counts.viewers[user].watching++;
      } else {
        counts.viewers[user].unwatched++;
      }

      if (
        movie.addedBy &&
        movie.addedBy.toLowerCase() === user.toLowerCase()
      ) {
        counts.addedBy[user]++;
      }
    }
  }

  return counts;
};

export const sortMovieList = (
  movies: Movie[],
  sortBy: MovieSortOrder = "recent",
): Movie[] => {
  const sorted = [...movies];
  switch (sortBy) {
    case "alpha":
      return sorted.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
        }),
      );
    case "genre":
      return sorted.sort((a, b) => {
        const genreA = (a.genre || "").trim().toLowerCase();
        const genreB = (b.genre || "").trim().toLowerCase();
        if (genreA !== genreB) {
          if (!genreA) return 1;
          if (!genreB) return -1;
          return genreA.localeCompare(genreB);
        }
        return (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
        });
      });
    case "rating":
      return sorted.sort((a, b) => {
        const ratingA = parseFloat(a.imdbRating ?? "0") || 0;
        const ratingB = parseFloat(b.imdbRating ?? "0") || 0;
        return ratingB - ratingA;
      });
    case "recent":
    default:
      return sorted.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }
};

export const filterMovieWall = (
  movies: Movie[],
  filters: MovieWallFilterState,
): Movie[] => {
  const filtered = movies.filter((movie) => {
    // 1. Text search query
    if (filters.query?.trim()) {
      const q = filters.query.trim().toLowerCase();
      const titleMatch = movie.title?.toLowerCase().includes(q);
      const directorMatch = movie.director?.toLowerCase().includes(q);
      const actorMatch = movie.actors?.toLowerCase().includes(q);
      const genreMatch = movie.genre?.toLowerCase().includes(q);
      const plotMatch = movie.plot?.toLowerCase().includes(q);
      if (!titleMatch && !directorMatch && !actorMatch && !genreMatch && !plotMatch) {
        return false;
      }
    }

    // 2. Media format
    if (filters.format !== "all") {
      const isTv = isTvSeriesItem(movie);
      const isYt = isYouTubeItem(movie);
      if (filters.format === "series" && !isTv) return false;
      if (filters.format === "youtube" && !isYt) return false;
      if (filters.format === "movie" && (isTv || isYt)) return false;
    }

    // 3. Genre
    if (filters.genre !== "all") {
      const genres = splitGenres(movie.genre);
      const target = filters.genre.toLowerCase();
      if (!genres.some((g) => g.toLowerCase() === target)) return false;
    }

    // 4. Status preset
    if (filters.statusPreset && filters.statusPreset !== "all") {
      const watchedCount = movie.watchedBy.length;
      const isWatching = (movie.watchingBy?.length ?? 0) > 0;
      if (filters.statusPreset === "queue" && (watchedCount > 0 || isWatching)) return false;
      if (filters.statusPreset === "both_watched" && watchedCount < 2) return false;
      if (filters.statusPreset === "in_progress" && !isWatching) return false;
    }

    // 5. Per-user watch progress (case-insensitive safe)
    for (const user of ["Aaron", "Electra"] as const) {
      const progress = filters[user];
      if (progress === "all") continue;
      const isWatched = movie.watchedBy.some((u) => u.toLowerCase() === user.toLowerCase());
      const isWatching = (movie.watchingBy ?? []).some((u) => u.toLowerCase() === user.toLowerCase());
      if (progress === "watched" && !isWatched) return false;
      if (progress === "watching" && !isWatching) return false;
      if (progress === "unwatched" && (isWatched || isWatching)) return false;
    }

    // 6. Added By (case-insensitive safe)
    if (filters.addedBy !== "all") {
      if (!movie.addedBy || movie.addedBy.toLowerCase() !== filters.addedBy.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  return sortMovieList(filtered, filters.sortBy ?? "recent");
};

