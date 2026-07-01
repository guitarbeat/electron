import { TVMAZE_BASE, METADATA_REQUEST_TIMEOUT_MS } from "./config.ts";
import { normalizePosterUrl } from "./omdb.ts";
import type { MovieAutocompleteResult } from "./types.ts";

interface TvMazeShow {
  id: number;
  name: string;
  premiered?: string;
  image?: { medium?: string; original?: string };
}

interface TvMazeSearchEntry {
  score: number;
  show: TvMazeShow;
}

export const searchTvMazeShows = async (
  query: string,
  signal?: AbortSignal,
): Promise<MovieAutocompleteResult[]> => {
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(TVMAZE_BASE, base);
  url.searchParams.set("mode", "search");
  url.searchParams.set("q", query);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      METADATA_REQUEST_TIMEOUT_MS,
    );
    const mergedSignal =
      signal && typeof AbortSignal.any === "function"
        ? AbortSignal.any([signal, controller.signal])
        : (signal ?? controller.signal);

    const response = await fetch(url.toString(), {
      signal: mergedSignal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`TVMaze search failed with status ${response.status}`);
    }

    const data = (await response.json()) as TvMazeSearchEntry[];

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((entry) => ({
      title: entry.show.name || "",
      year: entry.show.premiered?.split("-")[0],
      imdbID: `tv-${entry.show.id}`,
      type: "series" as const,
      poster: normalizePosterUrl(
        entry.show.image?.medium || entry.show.image?.original,
      ),
    }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new Error(
      `TVMaze search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { cause: error },
    );
  }
};
