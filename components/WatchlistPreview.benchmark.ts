/* eslint-disable no-console */
import { performance } from 'perf_hooks';

interface MovieMock {
  id: string;
  title: string;
  addedBy: string;
  watchedBy: string[];
  createdAt: string;
}

// Mock a Movie object
function createMovie(id: number): MovieMock {
  let watchedBy: string[] = [];
  const rand = Math.random();
  if (rand > 0.66) {
    watchedBy = ['Aaron', 'Electra'];
  } else if (rand > 0.33) {
    watchedBy = ['Aaron'];
  }

  return {
    id: `movie-${id}`,
    title: `Movie Title ${id}`,
    addedBy: 'Aaron',
    watchedBy,
    createdAt: new Date().toISOString(),
  };
}

// Generate a large dataset
const MOVIE_COUNT = 10000; // Realistic upper bound for watchlist
const movies = Array.from({ length: MOVIE_COUNT }, (_, i) => createMovie(i));

console.log(`Benchmarking filter operation with ${MOVIE_COUNT} movies...`);

// Measure filtering time
const start = performance.now();
for (let i = 0; i < 1000; i++) {
  // Simulate 1000 re-renders
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const unwatchedMovies = movies.filter((m) => m.watchedBy.length < 2);
}
const end = performance.now();

const totalTime = end - start;
const avgTime = totalTime / 1000;

console.log(`Total time for 1000 filter operations: ${totalTime.toFixed(4)} ms`);
console.log(`Average time per filter operation: ${avgTime.toFixed(4)} ms`);
