import type { Movie, MovieSuggestion } from "@/shared/types";
import {
  buildCollectionSections,
  compareCreatedAtDesc,
  compareStringsAlpha,
  type CollectionSections,
} from "../../../utils/workspace.ts";

export const MAX_MOVIE_NOTE_LENGTH = 280;
export const MAX_RECOMMENDATION_REASON_LENGTH = 280;
export const MAX_GUEST_SUGGESTER_NAME_LENGTH = 48;

export type MovieSortOrder = "recent" | "alpha" | "rating";

export type MovieSections = CollectionSections<Movie, MovieSuggestion>;

export const getAllMovies = (sections: MovieSections): Movie[] => [
  ...sections.queue,
  ...sections.completed,
];

function parseImdbRating(rating: string | undefined): number {
  return parseFloat(rating ?? "0") || 0;
}

function sortMovies(movies: Movie[], sortOrder: MovieSortOrder): Movie[] {
  const sorted = [...movies];
  switch (sortOrder) {
    case "alpha":
      return sorted.sort((a, b) => compareStringsAlpha(a.title, b.title));
    case "rating":
      return sorted.sort(
        (a, b) => parseImdbRating(b.imdbRating) - parseImdbRating(a.imdbRating),
      );
    case "recent":
    default:
      return sorted.sort(compareCreatedAtDesc);
  }
}

export const buildMovieSections = (
  movies: Movie[],
  pendingSuggestions: MovieSuggestion[],
  sortOrder: MovieSortOrder = "recent",
): MovieSections => {
  const sorted = sortMovies(movies, sortOrder);
  return buildCollectionSections(
    sorted,
    pendingSuggestions,
    (movie) => movie.watchedBy.length === 2,
  );
};
