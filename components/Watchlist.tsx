
import React from 'react';
import { Movie, User } from '../types';
import { CheckIcon, EyeIcon, TrashIcon } from './icons';

interface WatchlistProps {
  movies: Movie[];
  user: User;
  onToggleWatched: (id: number, watched: boolean) => void;
  onDeleteMovie: (id: number) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ movies, user, onToggleWatched, onDeleteMovie }) => {
  return (
    <div className="container mx-auto p-4 space-y-4">
      {movies.map((movie) => (
        <div
          key={movie.id}
          className={`cute-card p-4 flex items-center justify-between transition-all duration-300 ${
            movie.watched ? 'opacity-60 bg-gray-800/50' : ''
          }`}
        >
          <div className="flex flex-col">
            <h3 className={`text-xl font-bold text-white ${movie.watched ? 'line-through' : ''}`}>{movie.title}</h3>
            <p className="text-sm text-slate-300">
              Added by {movie.added_by}
              {movie.watched && movie.watched_by && ` | Watched by ${movie.watched_by}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWatched(movie.id, !movie.watched)}
              className={`p-2 rounded-full transition-colors duration-300 text-white ${
                movie.watched
                  ? 'bg-green-500/80 hover:bg-green-500'
                  : 'bg-slate-600/80 hover:bg-slate-500'
              }`}
              aria-label={movie.watched ? 'Mark as unwatched' : 'Mark as watched'}
            >
              {movie.watched ? <EyeIcon /> : <CheckIcon />}
            </button>
            {movie.added_by === user && (
              <button
                onClick={() => onDeleteMovie(movie.id)}
                className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors duration-300"
                aria-label="Delete movie"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Watchlist;
