// FIX: Implemented the usePolling custom hook to resolve compilation errors.
import { useState, useEffect, useRef, useCallback } from 'react';

export const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number | null,
  equalityFn?: (prev: T | undefined, next: T) => boolean,
) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const savedFetchFn = useRef(fetchFn);
  const savedEqualityFn = useRef(equalityFn);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    savedEqualityFn.current = equalityFn;
  }, [equalityFn]);

  const execute = useCallback(async (isInitialLoad: boolean) => {
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await savedFetchFn.current();
      setData((prevData) => {
        if (savedEqualityFn.current && savedEqualityFn.current(prevData, result)) {
          return prevData;
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
