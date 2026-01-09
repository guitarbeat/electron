// FIX: Implemented the usePolling custom hook to resolve compilation errors.
import { useState, useEffect, useRef, useCallback } from 'react';

export const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number | null,
) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const savedFetchFn = useRef(fetchFn);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  const execute = useCallback(async (isInitialLoad: boolean) => {
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await savedFetchFn.current();

      setData(prev => {
        // ⚡ Bolt Optimization: Deep comparison to avoid unnecessary re-renders
        // If the new data is identical to the previous data, return the previous reference
        // to prevent React state updates from triggering re-renders in consuming components.
        if (prev !== undefined && JSON.stringify(prev) === JSON.stringify(result)) {
          return prev;
        }
        return result;
      });
    } catch (e) {
      setError(e);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    execute(true); // initial fetch
    if (interval !== null) {
      const intervalId = setInterval(() => execute(false), interval);
      return () => clearInterval(intervalId);
    }
  }, [interval, execute]);

  const refresh = useCallback(() => execute(true), [execute]);

  return { data, error, isLoading, refresh };
};
