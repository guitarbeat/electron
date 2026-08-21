export type LibraryIntent = "movie" | "place" | "ambiguous";

export type LibrarySubmitKind =
  | "movie"
  | "place"
  | "show-movie"
  | "show-place";

export type LibrarySelection =
  | { kind: "movie-result"; title: string; imdbID?: string; type: "movie" | "series" }
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
  value.trim().toLowerCase();

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

  const wordCount = normalizeLibraryQuery(query).split(/\s+/).filter(Boolean)
    .length;
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
