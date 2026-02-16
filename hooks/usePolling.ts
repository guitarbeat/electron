// FIX: Implemented the usePolling custom hook to resolve compilation errors.
import { useState, useEffect, useRef, useCallback } from 'react';

export const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number | null,
  equalityFn?: (prev: T | undefined, next: T) => boolean
) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ⚡ Bolt Optimization: Use a ref for data to keep 'execute' stable.
  // This prevents 'execute' from changing when data updates, avoiding
  // unnecessary re-subscriptions and extra immediate fetches in the effect below.
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const savedFetchFn = useRef(fetchFn);
  const savedEqualityFn = useRef(equalityFn);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    savedEqualityFn.current = equalityFn;
  }, [equalityFn]);

  const execute = useCallback(async (isInitialLoad: boolean) => {
    // Only show loading if we don't have data yet
    if (isInitialLoad && !dataRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await savedFetchFn.current();

      // Validation check: if result is empty/invalid but we expect data, handle it
      if (result === undefined || result === null) {
        throw new Error('Fetched data is null or undefined');
      }

      setData((prevData) => {
        // usePolling.ts: FIX - Use functional update for savedEqualityFn to avoid stale closures
        // although savedEqualityFn is a ref, the check inside setData ensures we use the latest values
        if (savedEqualityFn.current && savedEqualityFn.current(prevData, result)) {
          return prevData;
        }
        return result;
      });
    } catch (e) {
      console.error('Polling execution failed:', e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    execute(true); // initial fetch
    if (interval !== null) {
      const intervalId = setInterval(() => execute(false), interval);
      return () => clearInterval(intervalId);
    }
    return undefined;
  }, [interval, execute]);

  const refresh = useCallback(() => execute(true), [execute]);

  return { data, error, isLoading, refresh };
};
