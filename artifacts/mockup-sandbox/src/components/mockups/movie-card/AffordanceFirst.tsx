import React, { useState } from "react";
import { Eye, Trash2, Check } from "lucide-react";

const MOVIES = [
  { id: "1", title: "Parasite", year: "2019", runtime: "132 min", imdbRating: "8.5", posterUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg", watchedBy: ["Aaron", "Electra"] },
  { id: "2", title: "Shrek (all of em)", year: "2001", runtime: "90 min", imdbRating: "7.9", posterUrl: "https://m.media-amazon.com/images/M/MV5BOGZhM2FhNTItODAzNi00YjA0LWEyN2UtNjJlYWQzYzU1MDg5L2ltYWdlXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg", watchedBy: ["Electra"] },
  { id: "3", title: "Fiona and Cake", year: "2023", runtime: null, imdbRating: "7.3", posterUrl: null, watchedBy: [] },
  { id: "4", title: "Bridgerton", year: "2020–", runtime: "60 min", imdbRating: "7.4", posterUrl: "https://m.media-amazon.com/images/M/MV5BZTQyNTM0NTgtZDNhMS00YmY0LTgxMzAtNmZmNzRlYTQ5ZDgxXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg", watchedBy: [] },
];
const AARON_PHOTO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa2Qa_ao3GRvb5R5TyT7lET-s_0iqlHUxWMg&s";
const ELECTRA_PHOTO = "https://i.redd.it/vkmos70wqw641.jpg";

export function AffordanceFirst() {
  return (
    <div className="min-h-screen bg-zinc-900 p-4 font-sans text-white">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-6 text-zinc-100">Watchlist</h1>
        <div className="grid grid-cols-2 gap-4">
          {MOVIES.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MovieCard({ movie }: { movie: typeof MOVIES[0] }) {
  const [watchedBy, setWatchedBy] = useState<string[]>(movie.watchedBy);
  const isWatchedByMe = watchedBy.includes("Aaron");

  const toggleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWatchedByMe) {
      setWatchedBy(watchedBy.filter(n => n !== "Aaron"));
    } else {
      setWatchedBy([...watchedBy, "Aaron"]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`Remove ${movie.title}`);
  };

  return (
    <div className="relative group flex flex-col w-full aspect-[2/3.5] bg-zinc-950 rounded-2xl overflow-hidden shadow-xl active:scale-[0.98] transition-transform ring-1 ring-zinc-800 focus-within:ring-zinc-600 cursor-pointer">
      
      {/* Poster Background */}
      {movie.posterUrl ? (
        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-zinc-800 flex items-center justify-center">
          <span className="text-zinc-500 font-medium">No Poster</span>
        </div>
      )}

      {/* Scrim for Top & Bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-zinc-950/95" />
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

      {/* Top Right: Watcher Avatars */}
      {watchedBy.length > 0 && (
        <div className="absolute top-2 right-2 flex -space-x-2 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
          {watchedBy.includes("Aaron") && (
            <img 
              src={AARON_PHOTO} 
              alt="Aaron" 
              className="w-7 h-7 rounded-full object-cover ring-2 ring-sky-400 z-10"
            />
          )}
          {watchedBy.includes("Electra") && (
            <img 
              src={ELECTRA_PHOTO} 
              alt="Electra" 
              className="w-7 h-7 rounded-full object-cover ring-2 ring-pink-400 z-0"
            />
          )}
        </div>
      )}

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 inset-x-0 p-3 flex flex-col gap-3">
        {/* Title & Info */}
        <div className="flex flex-col gap-0.5">
          <h3 className="font-bold text-sm leading-tight text-white line-clamp-2">
            {movie.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <span>{movie.year}</span>
            {movie.runtime && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <span>{movie.runtime}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons Container */}
        <div className="flex flex-col gap-2">
          {/* Main CTA */}
          <button 
            onClick={toggleWatch}
            className={`
              h-10 w-full rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg transition-all active:scale-95
              ${isWatchedByMe 
                ? "bg-zinc-700 text-zinc-300" 
                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500"}
            `}
          >
            {isWatchedByMe ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                Watched
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 stroke-[2.5]" />
                Mark Watched
              </>
            )}
          </button>

          {/* Remove Action */}
          <button 
            onClick={handleRemove}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors w-fit px-1 py-0.5 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Remove</span>
          </button>
        </div>
      </div>

    </div>
  );
}
