const SUPABASE_PROJECT_ID = 'jectngcrpikxwnjdwana';
const OMDB_PROXY_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/omdb-proxy`;

const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

const fetchWithRetry = async (url: string, retries = 3, backoff = 1000): Promise<Response> => {
  try {
    const response = await fetch(url);
    if (!response.ok && retries > 0) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, backoff);
      });
      return fetchWithRetry(url, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export interface MetadataResult {
  id?: string; // Search result ID (imdbID or TVMaze ID)
  posterUrl?: string;
  year?: string;
  plot?: string;
  imdbRating?: string;
  runtime?: string;
  genre?: string;
  director?: string;
  title?: string; // For search results
  type?: 'movie' | 'series';
}

export const fetchMovieMetadata = async (
  title: string,
  type?: 'movie' | 'series',
  id?: string
): Promise<MetadataResult> => {
  try {
    // If we have an ID and it's a TV show, use TVMaze directly by ID
    if (type === 'series' && id?.startsWith('tv-')) {
      const tvmazeId = id.replace('tv-', '');
      // Ensure the ID is safe for path usage
      const safeTvMazeId = encodeURIComponent(tvmazeId);
      const tvmazeUrl = `${TVMAZE_BASE_URL}/shows/${safeTvMazeId}`;
      const tvmazeRes = await fetchWithRetry(tvmazeUrl);
      const show = await tvmazeRes.json();

      if (show) {
        return {
          posterUrl: show.image?.medium || show.image?.original,
          year: show.premiered ? show.premiered.split('-')[0] : undefined,
          plot: show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : undefined,
          imdbRating: show.rating?.average?.toString(),
          genre: show.genres?.join(', '),
          title: show.name,
          type: 'series',
        };
      }
    }

    // If we have an IMDB ID, use OMDb by ID
    if (id && !id.startsWith('tv-')) {
      const omdbUrl = new URL(OMDB_PROXY_URL);
      omdbUrl.searchParams.append('i', id);

      const omdbRes = await fetchWithRetry(omdbUrl.toString());
      const omdbData = await omdbRes.json();

      if (omdbData.Response === 'True') {
        return {
          posterUrl: omdbData.Poster !== 'N/A' ? omdbData.Poster : undefined,
          year: omdbData.Year !== 'N/A' ? omdbData.Year : undefined,
          plot: omdbData.Plot !== 'N/A' ? omdbData.Plot : undefined,
          imdbRating: omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : undefined,
          runtime: omdbData.Runtime !== 'N/A' ? omdbData.Runtime : undefined,
          genre: omdbData.Genre !== 'N/A' ? omdbData.Genre : undefined,
          director: omdbData.Director !== 'N/A' ? omdbData.Director : undefined,
          type: omdbData.Type === 'series' ? 'series' : 'movie',
        };
      }
    }

    // 1. Try OMDb first (Best for Movies)
    const omdbUrl = new URL(OMDB_PROXY_URL);
    omdbUrl.searchParams.append('t', title);

    const omdbRes = await fetchWithRetry(omdbUrl.toString());
    const omdbData = await omdbRes.json();

    if (omdbData.Response === 'True') {
      return {
        posterUrl: omdbData.Poster !== 'N/A' ? omdbData.Poster : undefined,
        year: omdbData.Year !== 'N/A' ? omdbData.Year : undefined,
        plot: omdbData.Plot !== 'N/A' ? omdbData.Plot : undefined,
        imdbRating: omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : undefined,
        runtime: omdbData.Runtime !== 'N/A' ? omdbData.Runtime : undefined,
        genre: omdbData.Genre !== 'N/A' ? omdbData.Genre : undefined,
        director: omdbData.Director !== 'N/A' ? omdbData.Director : undefined,
        type: omdbData.Type === 'series' ? 'series' : 'movie',
      };
    }

    // 2. If OMDb fails or not found, try TVMaze (Best for TV Shows)
    const tvmazeUrl = new URL(`${TVMAZE_BASE_URL}/search/shows`);
    tvmazeUrl.searchParams.append('q', title);

    const tvmazeRes = await fetchWithRetry(tvmazeUrl.toString());
    const tvmazeData = await tvmazeRes.json();

    if (tvmazeData && tvmazeData.length > 0) {
      const { show } = tvmazeData[0];
      return {
        posterUrl: show.image?.medium || show.image?.original,
        year: show.premiered ? show.premiered.split('-')[0] : undefined,
        plot: show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : undefined, // Strip HTML tags
        imdbRating: show.rating?.average?.toString(),
        genre: show.genres?.join(', '),
        type: 'series',
      };
    }

    return {};
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {};
  }
};

export const searchMovies = async (query: string): Promise<MetadataResult[]> => {
  try {
    const results: MetadataResult[] = [];

    // 1. Search OMDb
    const omdbUrl = new URL(OMDB_PROXY_URL);
    omdbUrl.searchParams.append('s', query);

    const omdbRes = await fetchWithRetry(omdbUrl.toString());
    const omdbData = await omdbRes.json();

    if (omdbData.Response === 'True' && omdbData.Search) {
      results.push(
        ...omdbData.Search.map((item: any) => ({
          id: item.imdbID,
          title: item.Title,
          year: item.Year,
          posterUrl: item.Poster !== 'N/A' ? item.Poster : undefined,
          type: item.Type === 'series' ? 'series' : 'movie',
        }))
      );
    }

    // 2. Search TVMaze
    const tvmazeUrl = new URL(`${TVMAZE_BASE_URL}/search/shows`);
    tvmazeUrl.searchParams.append('q', query);

    const tvmazeRes = await fetchWithRetry(tvmazeUrl.toString());
    const tvmazeData = await tvmazeRes.json();

    if (tvmazeData && tvmazeData.length > 0) {
      results.push(
        ...tvmazeData.map((item: any) => ({
          id: `tv-${item.show.id}`,
          title: item.show.name,
          year: item.show.premiered ? item.show.premiered.split('-')[0] : undefined,
          posterUrl: item.show.image?.medium || item.show.image?.original,
          type: 'series',
          plot: item.show.summary ? item.show.summary.replace(/<[^>]*>?/gm, '') : undefined,
        }))
      );
    }

    // Remove duplicates by title+year (simple heuristic)
    const seen = new Set();
    return results.filter((item) => {
      const key = `${item.title}-${item.year}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.error('Error searching metadata:', error);
    return [];
  }
};
