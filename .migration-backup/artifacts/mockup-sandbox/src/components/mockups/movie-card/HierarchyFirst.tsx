import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Star, Clock, Calendar, Check, Minus } from 'lucide-react';

const MOVIES = [
  { id: "1", title: "Parasite", year: "2019", runtime: "132 min", imdbRating: "8.5", posterUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg", watchedBy: ["Aaron", "Electra"] },
  { id: "2", title: "Shrek (all of em)", year: "2001", runtime: "90 min", imdbRating: "7.9", posterUrl: "https://m.media-amazon.com/images/M/MV5BOGZhM2FhNTItODAzNi00YjA0LWEyN2UtNjJlYWQzYzU1MDg5L2ltYWdlXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg", watchedBy: ["Electra"] },
  { id: "3", title: "Fiona and Cake", year: "2023", runtime: null, imdbRating: "7.3", posterUrl: null, watchedBy: [] },
  { id: "4", title: "Bridgerton", year: "2020–", runtime: "60 min", imdbRating: "7.4", posterUrl: "https://m.media-amazon.com/images/M/MV5BZTQyNTM0NTgtZDNhMS00YmY0LTgxMzAtNmZmNzRlYTQ5ZDgxXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg", watchedBy: [] },
];
const AARON_PHOTO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa2Qa_ao3GRvb5R5TyT7lET-s_0iqlHUxWMg&s";
const ELECTRA_PHOTO = "https://i.redd.it/vkmos70wqw641.jpg";

export function HierarchyFirst() {
  const [movies, setMovies] = useState(MOVIES);

  const toggleWatch = (movieId: string, user: string) => {
    setMovies(prev => prev.map(m => {
      if (m.id === movieId) {
        const isWatched = m.watchedBy.includes(user);
        return {
          ...m,
          watchedBy: isWatched ? m.watchedBy.filter(u => u !== user) : [...m.watchedBy, user]
        };
      }
      return m;
    }));
  };

  const deleteMovie = (movieId: string) => {
    setMovies(prev => prev.filter(m => m.id !== movieId));
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-4 font-sans text-zinc-100">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-bold text-white tracking-tight">Watchlist</h1>
        <div className="grid grid-cols-2 gap-4">
          {movies.map(movie => {
            const isAaronWatched = movie.watchedBy.includes("Aaron");
            const isElectraWatched = movie.watchedBy.includes("Electra");
            const watchCount = movie.watchedBy.length;
            
            let statusColor = "bg-zinc-600";
            if (watchCount === 2) statusColor = "bg-green-500";
            else if (watchCount === 1) statusColor = "bg-amber-400";

            return (
              <div key={movie.id} className="group relative flex flex-col overflow-hidden rounded-xl bg-zinc-800 border border-zinc-700/50 shadow-sm transition-all hover:shadow-md">
                {/* Status Indicator Stripe */}
                <div className={`h-1.5 w-full ${statusColor}`} />
                
                {/* Poster Container */}
                <div className="relative h-[180px] w-full bg-zinc-800/50">
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                      <EyeOff className="h-10 w-10 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col p-3">
                  {/* Title */}
                  <h3 className="line-clamp-2 text-base font-bold leading-tight text-white mb-2">
                    {movie.title}
                  </h3>

                  {/* Metadata Row */}
                  <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{movie.year}</span>
                    </div>
                    {movie.runtime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{movie.runtime}</span>
                      </div>
                    )}
                    {movie.imdbRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{movie.imdbRating}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    {/* Watchers Row: Side by Side */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <button 
                        onClick={() => toggleWatch(movie.id, "Aaron")}
                        className={`flex flex-1 items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-zinc-700/50 ${isAaronWatched ? 'bg-sky-500/10' : 'opacity-70'}`}
                      >
                        <div className="relative shrink-0">
                          <img src={AARON_PHOTO} alt="Aaron" className={`h-6 w-6 rounded-full object-cover ring-2 ${isAaronWatched ? 'ring-sky-400' : 'ring-zinc-600 grayscale'}`} />
                        </div>
                        <div className="flex items-center gap-1">
                          {isAaronWatched ? (
                            <Check className="h-3 w-3 text-sky-400" strokeWidth={3} />
                          ) : (
                            <Minus className="h-3 w-3 text-zinc-500" strokeWidth={3} />
                          )}
                          <span className={`text-xs font-semibold ${isAaronWatched ? 'text-sky-400' : 'text-zinc-500'}`}>Aaron</span>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => toggleWatch(movie.id, "Electra")}
                        className={`flex flex-1 items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-zinc-700/50 ${isElectraWatched ? 'bg-pink-500/10' : 'opacity-70'}`}
                      >
                        <div className="relative shrink-0">
                          <img src={ELECTRA_PHOTO} alt="Electra" className={`h-6 w-6 rounded-full object-cover ring-2 ${isElectraWatched ? 'ring-pink-400' : 'ring-zinc-600 grayscale'}`} />
                        </div>
                        <div className="flex items-center gap-1">
                          {isElectraWatched ? (
                            <Check className="h-3 w-3 text-pink-400" strokeWidth={3} />
                          ) : (
                            <Minus className="h-3 w-3 text-zinc-500" strokeWidth={3} />
                          )}
                          <span className={`text-xs font-semibold ${isElectraWatched ? 'text-pink-400' : 'text-zinc-500'}`}>Electra</span>
                        </div>
                      </button>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleWatch(movie.id, "Aaron")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-700 py-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-600 active:bg-zinc-500"
                      >
                        {isAaronWatched ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {isAaronWatched ? 'Unwatch' : 'Mark watched'}
                      </button>
                      <button 
                        onClick={() => deleteMovie(movie.id)}
                        className="flex items-center justify-center rounded-lg bg-zinc-700/50 p-2.5 text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
