const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const API_URL = 'https://api.themoviedb.org/3';

export const searchMovies = async (query: string) => {
  if (!API_KEY) {
    throw new Error('TMDB API key is not configured.');
  }

  const response = await fetch(`${API_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch movies from TMDB.');
  }

  const data = await response.json();
  return data.results;
};
