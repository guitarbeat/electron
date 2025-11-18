import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useMovies } from '../hooks/useMovies';
import { Movie } from '../types';
import { TrashIcon, EyeIcon, EyeOffIcon, Spinner, SparkleHeartIcon, LogoutIcon, DiceIcon } from './icons';
import SpinWheel from './SpinWheel';
import MovieSearch from './MovieSearch';

const Watchlist: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  // FIX: Added non-null assertion as currentUser is guaranteed to exist in this component.
  const { movies, isLoading, error, isSubmitting, addMovie, toggleWatched, deleteMovie } = useMovies(currentUser!);

  const [isWheelVisible, setIsWheelVisible] = useState(false);

  const unwatchedMovies = movies ? movies.filter(movie => movie.watchedBy.length < 2) : [];

  const handleOpenWheel = () => {
    if (unwatchedMovies.length > 1) {
        setIsWheelVisible(true);
    } else {
        alert("You need at least two unwatched movies to spin the wheel!");
    }
  };

  const handleAddMovie = async (movie: Movie) => {
    if (!isSubmitting) {
      await addMovie(movie);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const getWatchedStatus = (movie: Movie) => {
    const aaronWatched = movie.watchedBy.includes('Aaron');
    const electraWatched = movie.watchedBy.includes('Electra');
    if (aaronWatched && electraWatched) return "Watched by both!";
    if (aaronWatched) return "Watched by Aaron";
    if (electraWatched) return "Watched by Electra";
    return "Not watched yet";
  };
  
  const firstWatchedIndex = movies ? movies.findIndex(m => m.watchedBy.length === 2) : -1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-12 w-12 text-pink-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 text-center text-red-400">
        <p>Error loading movies. Please try refreshing the page.</p>
        <p className="text-sm mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {isWheelVisible && <SpinWheel movies={unwatchedMovies} onClose={() => setIsWheelVisible(false)} />}
      <div className="max-w-3xl mx-auto">
        {/* Add Movie Form */}
        <div className="mb-4 cute-card p-4 flex gap-4 items-center">
          <button
            type="button"
            onClick={handleLogout}
            className="icon-button"
            title="Switch User"
          >
            <LogoutIcon />
          </button>
          <MovieSearch onAddMovie={handleAddMovie} isSubmitting={isSubmitting} />
        </div>
        
        {/* Spin to Decide card */}
        <div className="mb-8 cute-card p-4">
            <button
                onClick={handleOpenWheel}
                disabled={unwatchedMovies.length < 2}
                className="w-full cute-button cute-button-blue flex items-center justify-center gap-2"
                title={unwatchedMovies.length < 2 ? "Add more unwatched movies to use the wheel" : "Spin the wheel to pick a movie!"}
            >
                <DiceIcon />
                Spin to Decide!
            </button>
        </div>

        {/* Movie List */}
        <div className="space-y-4">
          {movies && movies.map((movie, index) => {
            const watchedByCurrentUser = movie.watchedBy.includes(currentUser!);
            const watchedByBoth = movie.watchedBy.length === 2;

            const cardClasses = [
              'cute-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative transition-all duration-300',
              watchedByBoth ? 'animate-pink-glow' : '',
              watchedByCurrentUser && !watchedByBoth ? 'opacity-60' : ''
            ].filter(Boolean).join(' ');

            const titleClasses = [
              'text-xl font-bold text-white transition-colors duration-300',
              watchedByBoth ? 'line-through text-gray-400' : ''
            ].filter(Boolean).join(' ');

            return (
              <React.Fragment key={movie.id}>
                {index === firstWatchedIndex && firstWatchedIndex !== -1 && (
                    <div className="flex items-center my-6 animate-fade-in">
                        <hr className="flex-grow border-pink-400 border-dashed" />
                        <span className="px-4 text-pink-300 font-heading">Watched Together</span>
                        <hr className="flex-grow border-pink-400 border-dashed" />
                    </div>
                )}
                <div className={cardClasses}>
                  <div className="flex-grow flex items-start gap-4">
                      {movie.poster_path ? (
                          <img
                              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                              alt={movie.title}
                              className="w-20 rounded-md shadow-lg"
                          />
                      ) : (
                          <div className="w-20 h-30 bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-400">
                              No Image
                          </div>
                      )}
                      <div className="flex-grow">
                          <h3 className={titleClasses}>{movie.title}</h3>
                          {movie.release_date && (
                              <p className="text-sm text-gray-400 mb-1">{movie.release_date.substring(0, 4)}</p>
                          )}
                          <p className="text-sm text-gray-400 mb-2">
                              Added by {movie.addedBy} &bull; {getWatchedStatus(movie)}
                          </p>
                          <p className="text-xs text-gray-500 max-h-16 overflow-y-auto pr-2 custom-scrollbar">
                              {movie.overview}
                          </p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                          onClick={() => toggleWatched(movie.id)}
                          disabled={isSubmitting}
                          className="icon-button disabled:opacity-50"
                          title={watchedByCurrentUser ? "Mark as unwatched" : "Mark as watched"}
                      >
                      {watchedByCurrentUser ? 
                          <EyeIcon /> : 
                          <EyeOffIcon />}
                      </button>
                      <button
                          onClick={() => deleteMovie(movie.id)}
                          disabled={isSubmitting}
                          className="icon-button text-red-400 disabled:opacity-50"
                          title="Delete movie"
                      >
                      <TrashIcon />
                      </button>
                  </div>
                </div>
              </React.Fragment>
            )
          })}
          {movies?.length === 0 && (
              <div className="text-center text-gray-400 cute-card p-8">
                  <p>Your movie list is empty!</p>
                  <p>Add a movie to get started~</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watchlist;