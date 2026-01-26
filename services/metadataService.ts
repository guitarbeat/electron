import { Movie } from '../types';

const OMDB_API_KEY = 'trilogy';
const OMDB_BASE_URL = 'https://www.omdbapi.com';
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
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, retries - 1, backoff * 2);
        }
        throw error;
    }
};

interface MetadataResult {
    posterUrl?: string;
    year?: string;
    plot?: string;
    imdbRating?: string;
    runtime?: string;
    genre?: string;
    director?: string;
}

export const fetchMovieMetadata = async (title: string): Promise<MetadataResult> => {
    try {
        // 1. Try OMDb first (Best for Movies)
        const omdbUrl = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
        const omdbRes = await fetchWithRetry(omdbUrl);
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
            };
        }

        // 2. If OMDb fails or not found, try TVMaze (Best for TV Shows)
        const tvmazeUrl = `${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(title)}`;
        const tvmazeRes = await fetchWithRetry(tvmazeUrl);
        const tvmazeData = await tvmazeRes.json();

        if (tvmazeData && tvmazeData.length > 0) {
            const show = tvmazeData[0].show;
            return {
                posterUrl: show.image?.medium || show.image?.original,
                year: show.premiered ? show.premiered.split('-')[0] : undefined,
                plot: show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : undefined, // Strip HTML tags
                imdbRating: show.rating?.average?.toString(),
                genre: show.genres?.join(', '),
            };
        }

        return {};
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return {};
    }
};
