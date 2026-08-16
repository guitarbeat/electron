import type { MovieAutocompleteResult } from "../../../services/metadata/types.ts";
import type { Movie, Place } from "../../../shared/types.ts";
import { getPlaceMeta } from "../../places/lib/placeMeta.ts";
import {
  classifyLibraryIntent,
  normalizeLibraryQuery,
  type LibrarySelection,
} from "./librarySearchIntent.ts";

export type LibraryAutocompleteRow = {
  id: string;
  group: "saved" | "titles" | "places";
  title: string;
  meta: string;
  posterUrl?: string;
  icon?: string;
  selection: Exclude<LibrarySelection, null>;
};

const MAX_SAVED = 3;
const MAX_TITLES = 6;

export const scoreLibraryMatch = (name: string, query: string): number => {
  const normalizedName = normalizeLibraryQuery(name);
  const normalizedQuery = normalizeLibraryQuery(query);
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return 0;
  }
  if (normalizedName === normalizedQuery) {
    return 3;
  }
  if (normalizedName.startsWith(normalizedQuery)) {
    return 2;
  }
  if (normalizedName.includes(normalizedQuery)) {
    return 1;
  }
  return 0;
};

export const matchLibraryMovies = (
  query: string,
  movies: readonly Pick<Movie, "id" | "title" | "year" | "posterUrl">[],
): LibraryAutocompleteRow[] =>
  movies
    .map((movie) => ({ movie, score: scoreLibraryMatch(movie.title, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.movie.title.localeCompare(right.movie.title))
    .slice(0, MAX_SAVED)
    .map((entry) => ({
      id: `saved-movie-${entry.movie.id}`,
      group: "saved" as const,
      title: entry.movie.title,
      meta: entry.movie.year ? `Saved movie • ${entry.movie.year}` : "Saved movie",
      posterUrl: entry.movie.posterUrl,
      selection: {
        kind: "library-movie" as const,
        movieId: entry.movie.id,
        title: entry.movie.title,
      },
    }));

export const matchLibraryPlaces = (
  query: string,
  places: readonly Pick<Place, "id" | "name">[],
): LibraryAutocompleteRow[] =>
  places
    .map((place) => ({ place, score: scoreLibraryMatch(place.name, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.place.name.localeCompare(right.place.name))
    .slice(0, MAX_SAVED)
    .map((entry) => {
      const meta = getPlaceMeta(entry.place.name);
      return {
        id: `saved-place-${entry.place.id}`,
        group: "saved" as const,
        title: entry.place.name,
        meta: `Saved place • ${meta.label}`,
        icon: meta.icon,
        selection: {
          kind: "library-place" as const,
          placeId: entry.place.id,
          name: entry.place.name,
        },
      };
    });

export const movieResultsToRows = (
  results: readonly MovieAutocompleteResult[],
): LibraryAutocompleteRow[] =>
  results.slice(0, MAX_TITLES).map((result, index) => ({
    id: `title-${result.imdbID ?? `${result.title}-${index}`}`,
    group: "titles" as const,
    title: result.title,
    meta: `${result.type === "series" ? "TV series" : "Movie"}${result.year ? ` • ${result.year}` : ""}`,
    posterUrl: result.poster,
    selection: {
      kind: "movie-result" as const,
      title: result.title,
      imdbID: result.imdbID,
      type: result.type,
    },
  }));

export const shouldOfferPlaceDraft = ({
  query,
  savedPlaces,
  intent,
  movieResultCount,
}: {
  query: string;
  savedPlaces: readonly LibraryAutocompleteRow[];
  intent: ReturnType<typeof classifyLibraryIntent>;
  movieResultCount: number;
}): boolean => {
  const normalized = normalizeLibraryQuery(query);
  if (normalized.length < 2) {
    return false;
  }
  const exactSaved = savedPlaces.some(
    (row) => normalizeLibraryQuery(row.title) === normalized,
  );
  if (exactSaved) {
    return false;
  }
  if (intent === "place") {
    return true;
  }
  if (intent === "movie") {
    return movieResultCount === 0;
  }
  return movieResultCount === 0 || normalized.split(/\s+/).length >= 2;
};

export const buildLibraryAutocompleteRows = ({
  query,
  movies,
  places,
  movieResults,
}: {
  query: string;
  movies: readonly Pick<Movie, "id" | "title" | "year" | "posterUrl">[];
  places: readonly Pick<Place, "id" | "name">[];
  movieResults: readonly MovieAutocompleteResult[];
}): LibraryAutocompleteRow[] => {
  const savedMovies = matchLibraryMovies(query, movies);
  const savedPlaces = matchLibraryPlaces(query, places);
  const titleRows = movieResultsToRows(movieResults);
  const intent = classifyLibraryIntent(query);
  const rows: LibraryAutocompleteRow[] = [
    ...savedMovies,
    ...savedPlaces,
    ...titleRows,
  ];

  if (
    shouldOfferPlaceDraft({
      query,
      savedPlaces,
      intent,
      movieResultCount: movieResults.length,
    })
  ) {
    const name = query.trim();
    const meta = getPlaceMeta(name);
    rows.push({
      id: `place-draft-${normalizeLibraryQuery(name)}`,
      group: "places",
      title: name,
      meta: `Add as a place • ${meta.label}`,
      icon: meta.icon,
      selection: { kind: "place-draft", name },
    });
  }

  return rows;
};

export const libraryAutocompleteGroupLabel = (
  group: LibraryAutocompleteRow["group"],
): string => {
  if (group === "saved") {
    return "Already saved";
  }
  if (group === "titles") {
    return "Movies & shows";
  }
  return "Places";
};
