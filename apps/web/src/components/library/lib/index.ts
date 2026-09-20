import type { MovieAutocompleteResult } from "@/services/metadata";
import type { Movie, Place } from "@/shared/types";

export type LibraryIntent = "movie" | "place" | "ambiguous";

export type LibrarySubmitKind = "movie" | "place" | "show-movie" | "show-place";

export type LibrarySelection =
  | {
      kind: "movie-result";
      title: string;
      imdbID?: string;
      type: "movie" | "series" | "youtube";
    }
  | { kind: "library-movie"; movieId: string; title: string }
  | { kind: "library-place"; placeId: string; name: string }
  | { kind: "place-draft"; name: string }
  | null;

const PLACE_SIGNAL =
  /\b(restaurant|diner|bistro|brasserie|grill|steakhouse|bbq|sushi|pizza|tacos|ramen|burger|cafe|café|coffee|espresso|bakery|patisserie|pastry|tea|bar|pub|brewery|taproom|cocktail|lounge|nightclub|wine|park|garden|trail|forest|nature|woods|hike|botanical|beach|ocean|lake|river|museum|gallery|hotel|resort|airbnb|hostel|inn|gym|yoga|spa|shop|store|market|mall|zoo|aquarium|airport|station|library|bookstore|bridge|landmark|island|cove)\b/i;

const STREET_ADDRESS =
  /\d+\s+\w+(?:\s+\w+)*\s+(st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|way|ct|court)\b/i;

const CITY_COMMA = /,\s*[A-Za-z][A-Za-z.\s-]{1,40}$/;

const MOVIE_SIGNAL =
  /\b(movie|film|series|season|episode|imdb|netflix|hulu|max)\b|\(\s*(19|20)\d{2}\s*\)|\b(19|20)\d{2}\b/i;

export const normalizeLibraryQuery = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const editDistance = (left: string, right: string): number => {
  const distances = Array.from({ length: left.length + 1 }, (_, leftIndex) =>
    Array.from({ length: right.length + 1 }, (_, rightIndex) =>
      leftIndex === 0 ? rightIndex : leftIndex,
    ),
  );
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution =
        distances[leftIndex - 1][rightIndex - 1] +
        (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      distances[leftIndex][rightIndex] = Math.min(
        distances[leftIndex - 1][rightIndex] + 1,
        distances[leftIndex][rightIndex - 1] + 1,
        substitution,
      );
      if (
        leftIndex > 1 &&
        rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        distances[leftIndex][rightIndex] = Math.min(
          distances[leftIndex][rightIndex],
          distances[leftIndex - 2][rightIndex - 2] + 1,
        );
      }
    }
  }
  return distances[left.length][right.length];
};

export const classifyLibraryIntent = (query: string): LibraryIntent => {
  const normalized = normalizeLibraryQuery(query);
  if (!normalized) {
    return "ambiguous";
  }

  const looksLikePlace =
    PLACE_SIGNAL.test(normalized) ||
    STREET_ADDRESS.test(normalized) ||
    CITY_COMMA.test(query.trim());
  const looksLikeMovie = MOVIE_SIGNAL.test(normalized);

  if (looksLikePlace && looksLikeMovie) {
    return "ambiguous";
  }
  if (looksLikePlace) {
    return "place";
  }
  if (looksLikeMovie) {
    return "movie";
  }
  return "ambiguous";
};

export const resolveLibrarySubmitKind = ({
  query,
  selection,
  movieResultCount,
}: {
  query: string;
  selection: LibrarySelection;
  movieResultCount: number;
}): LibrarySubmitKind => {
  if (selection?.kind === "library-movie") {
    return "show-movie";
  }
  if (selection?.kind === "library-place") {
    return "show-place";
  }
  if (selection?.kind === "movie-result") {
    return "movie";
  }
  if (selection?.kind === "place-draft") {
    return "place";
  }

  const intent = classifyLibraryIntent(query);
  if (intent === "place") {
    return "place";
  }
  if (intent === "movie") {
    return "movie";
  }

  if (movieResultCount > 0) {
    return "movie";
  }

  const wordCount = normalizeLibraryQuery(query)
    .split(/\s+/)
    .filter(Boolean).length;
  return wordCount >= 2 ? "place" : "movie";
};

export const librarySubmitLabel = (
  kind: LibrarySubmitKind,
  isGuest: boolean,
): string => {
  if (kind === "show-movie" || kind === "show-place") {
    return "Show";
  }
  if (kind === "place") {
    return isGuest ? "Suggest place" : "Add place";
  }
  return isGuest ? "Suggest movie" : "Add movie";
};

export const libraryAlternateKind = (
  kind: LibrarySubmitKind,
): "movie" | "place" | null => {
  if (kind === "movie") {
    return "place";
  }
  if (kind === "place") {
    return "movie";
  }
  return null;
};

export type LibraryAutocompleteRow = {
  id: string;
  group: "saved" | "titles" | "places";
  title: string;
  meta: string;
  posterUrl?: string;
  icon?: string;
  actionLabel: "Open" | "Choose";
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
    return 100;
  }
  if (normalizedName.startsWith(normalizedQuery)) {
    return 85;
  }
  if (normalizedName.includes(normalizedQuery)) {
    return 70;
  }

  const queryWords = normalizedQuery.split(" ");
  const nameWords = normalizedName.split(" ");
  const maxDistance = normalizedQuery.length <= 4 ? 1 : normalizedQuery.length <= 8 ? 2 : 3;
  const fullDistance = editDistance(normalizedName, normalizedQuery);
  const wordDistance = Math.max(
    ...queryWords.map((queryWord) =>
      Math.min(
        ...nameWords.map((nameWord) => editDistance(nameWord, queryWord)),
      ),
    ),
  );
  const distance = Math.min(fullDistance, wordDistance);
  return distance <= maxDistance ? 60 - distance * 5 : 0;
};

export const matchLibraryMovies = (
  query: string,
  movies: readonly Pick<Movie, "id" | "title" | "year" | "posterUrl">[],
): LibraryAutocompleteRow[] =>
  movies
    .map((movie) => ({ movie, score: scoreLibraryMatch(movie.title, query) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.movie.title.localeCompare(right.movie.title),
    )
    .slice(0, MAX_SAVED)
    .map((entry) => ({
      id: `saved-movie-${entry.movie.id}`,
      group: "saved" as const,
      title: entry.movie.title,
      meta: entry.movie.year
        ? `Saved movie • ${entry.movie.year}`
        : "Saved movie",
      posterUrl: entry.movie.posterUrl,
      actionLabel: "Open" as const,
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
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.place.name.localeCompare(right.place.name),
    )
    .slice(0, MAX_SAVED)
    .map((entry) => {
      const meta = { title: entry.place.name, label: "Place", icon: "📍" };
      return {
        id: `saved-place-${entry.place.id}`,
        group: "saved" as const,
        title: entry.place.name,
        meta: `Saved place • ${meta.label}`,
        icon: meta.icon,
        actionLabel: "Open" as const,
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
    actionLabel: "Choose" as const,
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
    const meta = { title: name, label: "Place", icon: "📍" };
    rows.push({
      id: `place-draft-${normalizeLibraryQuery(name)}`,
      group: "places",
      title: name,
      meta: `Add as a place • ${meta.label}`,
      icon: meta.icon,
      actionLabel: "Choose",
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
