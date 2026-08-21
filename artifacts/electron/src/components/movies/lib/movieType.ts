import type { Movie } from "@/shared/types";

export type MediaTypeFilter = "all" | "movie" | "series";

/**
 * Robustly detects whether a movie record is a TV Series.
 * Checks mediaType, category, runtime (seasons/episodes), and year ranges (e.g. 2020–2024).
 */
export const isTvSeries = (movie: Partial<Movie>): boolean => {
  if (movie.mediaType === "series") return true;
  if (movie.mediaType === "movie") return false;

  const cat = movie.category?.toLowerCase() ?? "";
  if (cat.includes("series") || cat.includes("tv")) return true;

  const runtime = movie.runtime?.toLowerCase() ?? "";
  if (runtime.includes("season") || runtime.includes("ep")) return true;

  if (movie.year && /\d{4}\s*[–-]\s*(\d{4})?/.test(movie.year)) return true;

  return false;
};

export const getMediaType = (movie: Partial<Movie>): "movie" | "series" =>
  isTvSeries(movie) ? "series" : "movie";

export const filterMoviesByMediaType = (
  movies: Movie[],
  filter: MediaTypeFilter,
): Movie[] => {
  if (filter === "all") return movies;
  return movies.filter((m) =>
    filter === "series" ? isTvSeries(m) : !isTvSeries(m),
  );
};
