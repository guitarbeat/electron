import type { Movie, User } from "@/shared/types";

export type MovieFormatFilter = "all" | "movie" | "series" | "youtube";
export type MovieProgressFilter = "all" | "unwatched" | "watching" | "watched";
export type MovieAddedByFilter = "all" | User;

export interface MovieWallFilterState {
  format: MovieFormatFilter;
  genre: string;
  Aaron: MovieProgressFilter;
  Electra: MovieProgressFilter;
  addedBy: MovieAddedByFilter;
}

export const DEFAULT_MOVIE_WALL_FILTERS: MovieWallFilterState = {
  format: "all",
  genre: "all",
  Aaron: "all",
  Electra: "all",
  addedBy: "all",
};

const splitGenres = (genre?: string): string[] =>
  (genre ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

export const getMovieWallGenres = (movies: Movie[]): string[] =>
  [...new Set(movies.flatMap((movie) => splitGenres(movie.genre)))].sort((a, b) =>
    a.localeCompare(b),
  );

export const hasActiveMovieWallFilters = (
  filters: MovieWallFilterState,
): boolean =>
  filters.format !== "all" ||
  filters.genre !== "all" ||
  filters.Aaron !== "all" ||
  filters.Electra !== "all" ||
  filters.addedBy !== "all";

export const filterMovieWall = (
  movies: Movie[],
  filters: MovieWallFilterState,
): Movie[] =>
  movies.filter((movie) => {
    const mediaType = movie.mediaType ?? "movie";
    if (filters.format !== "all" && mediaType !== filters.format) return false;

    if (
      filters.genre !== "all" &&
      !splitGenres(movie.genre).some(
        (genre) => genre.toLocaleLowerCase() === filters.genre.toLocaleLowerCase(),
      )
    ) {
      return false;
    }

    for (const user of ["Aaron", "Electra"] as const) {
      const progress = filters[user];
      if (progress === "watched" && !movie.watchedBy.includes(user)) return false;
      if (progress === "watching" && !movie.watchingBy?.includes(user)) return false;
      if (
        progress === "unwatched" &&
        (movie.watchedBy.includes(user) || movie.watchingBy?.includes(user))
      ) return false;
    }

    return filters.addedBy === "all" || movie.addedBy === filters.addedBy;
  });
