import { performance } from 'perf_hooks';

const generateMockGame = (likesCount: number, poolSize: number) => {
  const allIds = Array.from({ length: poolSize }, (_, i) => i.toString());

  // Create intersection of roughly 20%
  const aaronLikes = allIds.slice(0, likesCount);
  const electraLikes = allIds.slice(likesCount * 0.8, likesCount * 1.8);

  const movieMap = new Map();
  allIds.forEach(id => movieMap.set(id, { id, title: `Movie ${id}` }));

  return {
    game: { aaronLikes, electraLikes },
    movieMap
  };
};

const runBenchmark = (likesCount: number) => {
  const { game, movieMap } = generateMockGame(likesCount, 100000);

  // Current implementation (O(N^2) via includes)
  const startCurrent = performance.now();
  for (let i = 0; i < 100; i++) {
    const intersection = game.aaronLikes.filter((id) => game.electraLikes.includes(id));
    intersection.map((id) => movieMap.get(id)).filter((m) => !!m);
  }
  const endCurrent = performance.now();

  // Optimized implementation (O(N) via Set)
  const startOptimized = performance.now();
  for (let i = 0; i < 100; i++) {
    const electraLikesSet = new Set(game.electraLikes);
    const intersection = game.aaronLikes.filter((id) => electraLikesSet.has(id));
    intersection.map((id) => movieMap.get(id)).filter((m) => !!m);
  }
  const endOptimized = performance.now();

  console.log(`Array Size: ${likesCount}`);
  console.log(`Current (O(N^2)): ${(endCurrent - startCurrent).toFixed(2)}ms`);
  console.log(`Optimized (O(N)): ${(endOptimized - startOptimized).toFixed(2)}ms`);
  console.log(`Improvement: ${(((endCurrent - startCurrent) - (endOptimized - startOptimized)) / (endCurrent - startCurrent) * 100).toFixed(2)}%`);
  console.log('---');
};

console.log('--- Matchmaker Intersection Benchmark ---');
runBenchmark(100);
runBenchmark(1000);
runBenchmark(5000);
runBenchmark(10000);
