import { useMoviesScope } from "./index";
import type { User, Movie } from "@/shared/types";

export function useMovies(currentUser?: User, isPaused = false) {
  const { data, isLoading, mutate } = useMoviesScope({ isPaused });
  const movies = (data as Movie[]) || [];

  const addMovie = async (movie: Partial<Movie>) => {
    const newMovies = [
      ...movies,
      {
        id: movie.id || `m-${Date.now()}`,
        title: movie.title || "",
        year: movie.year || new Date().getFullYear().toString(),
        imageUrl: movie.imageUrl || "",
        addedBy: currentUser || "Aaron",
        watched: movie.watched || false,
        createdAt: new Date().toISOString(),
        ...movie,
      } as Movie,
    ];
    await mutate(newMovies);
  };

  const deleteMovie = async (id: string) => {
    const updated = movies.filter((m) => m.id !== id);
    await mutate(updated);
  };

  const toggleWatched = async (id: string) => {
    const updated = movies.map((m) =>
      m.id === id ? { ...m, watched: !m.watched } : m
    );
    await mutate(updated);
  };

  return {
    movies,
    isLoading,
    addMovie,
    deleteMovie,
    toggleWatched,
  };
}

export default useMovies;
