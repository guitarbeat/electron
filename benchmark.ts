import { performance } from 'perf_hooks';

interface Movie {
  watchedBy: string[];
}

const numMovies = 100000;
const movies: Movie[] = Array.from({ length: numMovies }, (_, i) => ({
  watchedBy: i % 3 === 0 ? ['Aaron', 'Electra'] : ['Aaron'],
}));

function baseline(movies: Movie[]) {
  const unwatchedMovies = movies ? movies.filter((movie) => movie.watchedBy.length < 2) : [];
  const watchedMovies = movies ? movies.filter((movie) => movie.watchedBy.length === 2) : [];
  return [unwatchedMovies, watchedMovies];
}

function optimized(movies: Movie[]) {
  if (!movies) return [[], []];
  const unwatched: Movie[] = [];
  const watched: Movie[] = [];
  movies.forEach((movie) => {
    if (movie.watchedBy.length < 2) {
      unwatched.push(movie);
    } else {
      watched.push(movie);
    }
  });
  return [unwatched, watched];
}

const runs = 100;

// Warmup
for (let i = 0; i < 10; i++) {
  baseline(movies);
  optimized(movies);
}

let start = performance.now();
for (let i = 0; i < runs; i++) {
  baseline(movies);
}
const baselineTime = performance.now() - start;

start = performance.now();
for (let i = 0; i < runs; i++) {
  optimized(movies);
}
const optimizedTime = performance.now() - start;

console.log(`Baseline: ${baselineTime.toFixed(2)}ms`);
console.log(`Optimized: ${optimizedTime.toFixed(2)}ms`);
console.log(`Improvement: ${(((baselineTime - optimizedTime) / baselineTime) * 100).toFixed(2)}%`);
