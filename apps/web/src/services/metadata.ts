export interface MovieAutocompleteResult {
  id: string;
  title: string;
  year?: string;
  poster?: string;
  type?: string;
}

const autocompleteCache = new Map<string, MovieAutocompleteResult[]>();

export async function searchMovieAutocomplete(
  query: string,
): Promise<MovieAutocompleteResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  if (autocompleteCache.has(trimmed)) {
    return autocompleteCache.get(trimmed)!;
  }

  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=trilogy&s=${encodeURIComponent(trimmed)}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (data && data.Search && Array.isArray(data.Search)) {
      const results: MovieAutocompleteResult[] = data.Search.map((item: { imdbID: string; Title: string; Year?: string; Poster?: string; Type?: string }) => ({
        id: item.imdbID,
        title: item.Title,
        year: item.Year,
        poster: item.Poster !== "N/A" ? item.Poster : undefined,
        type: item.Type,
      }));
      autocompleteCache.set(trimmed, results);
      return results;
    }
  } catch (err) {
    console.warn("OMDb autocomplete error:", err);
  }

  return [];
}

export function getCachedMovieAutocomplete(query: string): MovieAutocompleteResult[] | undefined {
  return autocompleteCache.get(query.trim().toLowerCase());
}

export async function fetchOmdbMetadataCached(title: string, year?: string) {
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=trilogy&t=${encodeURIComponent(title)}${year ? `&y=${encodeURIComponent(year)}` : ""}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.Response === "True") {
      return data;
    }
  } catch (err) {
    console.warn("fetchOmdbMetadataCached error:", err);
  }
  return null;
}
