import { performance } from 'perf_hooks';

interface Movie {
  watchedBy: string[];
}

const numMovies = 10000;
const movies: Movie[] = Array.from({ length: numMovies }, (_, i) => ({
  watchedBy: i % 3 === 0 ? ['Aaron', 'Electra'] : ['Aaron'],
}));

function baseline(movies: Movie[]) {
  const unwatchedMovies = movies ? movies.filter((movie) => movie.watchedBy.length < 2) : [];
  const watchedMovies = movies ? movies.filter((movie) => movie.watchedBy.length === 2) : [];
  return [unwatchedMovies, watchedMovies];
}

function optimized(movies: Movie[]) {
  return movies ? movies.reduce<[Movie[], Movie[]]>(
    (acc, movie) => {
      acc[movie.watchedBy.length < 2 ? 0 : 1].push(movie);
      return acc;
    },
    [[], []]
  ) : [[], []];
}

const runs = 1000;

// Warmup
for (let i = 0; i < 100; i++) {
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
console.log(`Optimized (reduce): ${optimizedTime.toFixed(2)}ms`);
console.log(`Improvement: ${(((baselineTime - optimizedTime) / baselineTime) * 100).toFixed(2)}%`);
