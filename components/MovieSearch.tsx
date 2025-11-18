import React, { useState } from 'react';
import { Spinner, SearchIcon } from './icons';
import { Movie } from '../types';
import { searchMovies } from '../services/tmdb';

interface MovieSearchProps {
  onAddMovie: (movie: Movie) => void;
  isSubmitting: boolean;
}

const MovieSearch: React.FC<MovieSearchProps> = ({ onAddMovie, isSubmitting }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const movieResults = await searchMovies(query);
      setResults(movieResults.map((movie: any) => ({
        id: movie.id.toString(),
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        overview: movie.overview,
        addedBy: '', // This will be set when the movie is added to the watchlist
        watchedBy: [],
      })));
    } catch (err) {
      setError('Failed to search for movies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMovie = (movie: Movie) => {
    onAddMovie(movie);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex gap-4 items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie..."
          className="flex-grow bg-transparent focus:outline-none text-white placeholder-gray-400 cute-input"
        />
        <button
          type="submit"
          className="cute-button cute-button-pink p-3 !rounded-full aspect-square"
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? <Spinner className="h-6 w-6" /> : <SearchIcon />}
        </button>
      </form>
      {error && <p className="text-red-400 mt-2">{error}</p>}
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-lg" data-testid="search-results">
          <ul>
            {results.map((movie) => (
              <li
                key={movie.id}
                className="p-4 hover:bg-gray-700 cursor-pointer"
                onClick={() => handleSelectMovie(movie)}
              >
                {movie.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MovieSearch;