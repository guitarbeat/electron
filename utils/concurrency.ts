/**
 * Helper to control concurrency when processing array items.
 *
 * @param items - The array of items to process.
 * @param concurrency - The maximum number of concurrent operations.
 * @param fn - The async function to execute for each item.
 * @returns A promise that resolves to an array of results in the same order as items.
 */
export const concurrentMap = async <T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results = new Array(items.length);
  const iterator = items.entries();
  const worker = async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [index, item] of iterator) {
      // eslint-disable-next-line no-await-in-loop
      results[index] = await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(items.length, concurrency) }, worker));
  return results;
};
