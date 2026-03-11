const n = 10000;
const m = 1000;
const activePoolMovies = Array.from({ length: n }, (_, i) => ({ id: `id_${i}` }));
const swipedIds = Array.from({ length: m }, (_, i) => `id_${Math.floor(Math.random() * n)}`);

console.time('baseline');
for (let i = 0; i < 100; i++) {
  activePoolMovies.filter((m) => !swipedIds.includes(m.id));
}
console.timeEnd('baseline');

console.time('optimized');
for (let i = 0; i < 100; i++) {
  const swipedSet = new Set(swipedIds);
  activePoolMovies.filter((m) => !swipedSet.has(m.id));
}
console.timeEnd('optimized');
