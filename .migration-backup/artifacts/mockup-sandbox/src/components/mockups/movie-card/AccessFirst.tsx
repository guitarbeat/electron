import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Star, Clock, Calendar, CheckCircle2, Circle, Film } from 'lucide-react';

const INITIAL_MOVIES = [
  { id: "1", title: "Parasite", year: "2019", runtime: "132 min", imdbRating: "8.5", posterUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg", watchedBy: ["Aaron", "Electra"] },
  { id: "2", title: "Shrek (all of em)", year: "2001", runtime: "90 min", imdbRating: "7.9", posterUrl: "https://m.media-amazon.com/images/M/MV5BOGZhM2FhNTItODAzNi00YjA0LWEyN2UtNjJlYWQzYzU1MDg5L2ltYWdlXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg", watchedBy: ["Electra"] },
  { id: "3", title: "Fiona and Cake", year: "2023", runtime: null, imdbRating: "7.3", posterUrl: null, watchedBy: [] },
  { id: "4", title: "Bridgerton", year: "2020–", runtime: "60 min", imdbRating: "7.4", posterUrl: "https://m.media-amazon.com/images/M/MV5BZTQyNTM0NTgtZDNhMS00YmY0LTgxMzAtNmZmNzRlYTQ5ZDgxXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg", watchedBy: [] },
];
const AARON_PHOTO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa2Qa_ao3GRvb5R5TyT7lET-s_0iqlHUxWMg&s";
const ELECTRA_PHOTO = "https://i.redd.it/vkmos70wqw641.jpg";

export function AccessFirst() {
  const [movies, setMovies] = useState(INITIAL_MOVIES);
  const currentUser = "Aaron";

  const toggleWatchStatus = (id: string) => {
    setMovies(current => current.map(movie => {
      if (movie.id === id) {
        const isWatched = movie.watchedBy.includes(currentUser);
        return {
          ...movie,
          watchedBy: isWatched 
            ? movie.watchedBy.filter(u => u !== currentUser)
            : [...movie.watchedBy, currentUser]
        };
      }
      return movie;
    }));
  };

  const removeMovie = (id: string) => {
    setMovies(current => current.filter(movie => movie.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans text-slate-200">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-bold text-white mb-6 px-1">Watchlist</h1>
        
        <div className="flex flex-col gap-4">
          {movies.map(movie => {
            const isAaronWatched = movie.watchedBy.includes("Aaron");
            const isElectraWatched = movie.watchedBy.includes("Electra");
            const bothWatched = isAaronWatched && isElectraWatched;
            const isCurrentUserWatched = movie.watchedBy.includes(currentUser);

            let statusColor = "bg-slate-800 text-slate-400 border-slate-700";
            let statusText = "Not yet watched";
            let StatusIcon = Circle;

            if (bothWatched) {
              statusColor = "bg-emerald-900/40 text-emerald-300 border-emerald-700";
              statusText = "✓ Watched by both";
              StatusIcon = CheckCircle2;
            } else if (isAaronWatched) {
              statusColor = "bg-amber-900/40 text-amber-300 border-amber-700";
              statusText = "✓ Aaron watched";
              StatusIcon = CheckCircle2;
            } else if (isElectraWatched) {
              statusColor = "bg-amber-900/40 text-amber-300 border-amber-700";
              statusText = "✓ Electra watched";
              StatusIcon = CheckCircle2;
            }

            return (
              <article 
                key={movie.id} 
                className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-4 w-full focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-950"
              >
                {/* Thumbnail Column */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-[64px] h-[80px] bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                    {movie.posterUrl ? (
                      <img 
                        src={movie.posterUrl} 
                        alt={`Poster for ${movie.title}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-8 h-8 text-slate-500" aria-label="No poster available" />
                    )}
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-grow min-w-0 flex flex-col">
                  <h2 className="text-lg font-bold text-white leading-tight mb-2 truncate" title={movie.title}>
                    {movie.title}
                  </h2>
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      {movie.year}
                    </span>
                    {movie.runtime && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {movie.runtime}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                      <Star className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" />
                      {movie.imdbRating}
                    </span>
                  </div>

                  {/* Status Row */}
                  <div className="mb-4 flex flex-col gap-2">
                    <div className={`inline-flex items-center self-start gap-2 px-3 py-1.5 rounded-md border ${statusColor}`}>
                      <StatusIcon className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm font-semibold">{statusText}</span>
                    </div>
                    
                    {movie.watchedBy.length > 0 && (
                      <div className="flex gap-4 mt-2">
                        {isAaronWatched && (
                          <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                            <img src={AARON_PHOTO} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-600" />
                            <span className="text-xs font-medium text-slate-300">Aaron</span>
                          </div>
                        )}
                        {isElectraWatched && (
                          <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                            <img src={ELECTRA_PHOTO} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-600" />
                            <span className="text-xs font-medium text-slate-300">Electra</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center gap-3 mt-auto pt-2 border-t border-slate-800">
                    <button
                      onClick={() => toggleWatchStatus(movie.id)}
                      className="flex-1 min-w-[140px] flex justify-center items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      {isCurrentUserWatched ? (
                        <>
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                          Mark Unwatched
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" aria-hidden="true" />
                          Mark Watched
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => removeMovie(movie.id)}
                      className="flex items-center gap-2 bg-transparent hover:bg-red-950/30 text-slate-400 hover:text-red-400 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
