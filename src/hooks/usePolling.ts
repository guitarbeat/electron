// FIX: Implemented the usePolling custom hook to resolve compilation errors.
import { useState, useEffect, useRef, useCallback } from 'react';
import { pollingManager } from '@/services/PollingManager;

export const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number | null,
  equalityFn?: (prev: T | undefined, next: T) => boolean,
  options: { isPaused?: boolean; key?: string } = {}
) => {
  const { isPaused = false, key } = options;

  // Initialize state with cached data if available
  const [data, setData] = useState<T | undefined>(() => {
    if (key) {
      const cached = pollingManager.getData(key);
      if (cached !== undefined) return cached;
    }
    return undefined;
  });

  const [error, setError] = useState<any>(() => {
    if (key) {
      const cachedError = pollingManager.getError(key);
      if (cachedError) return cachedError;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (key) {
      return (
        pollingManager.getData(key) === undefined && pollingManager.getError(key) === undefined
      );
    }
    return true;
  });

  // ⚡ Bolt Optimization: Use a ref for data to keep 'execute' stable.
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

  const executeLocal = useCallback(async (isInitialLoad: boolean) => {
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
    if (isPaused) {
      return undefined;
    }

    if (key && interval !== null) {
      // Use shared polling manager
      // Pass a proxy function to ensure we always call the latest fetchFn
      const proxyFetch = () => savedFetchFn.current();

      const unsubscribe = pollingManager.subscribe(
        key,
        proxyFetch,
        interval,
        (newData, newError) => {
          if (newError) {
            setError(newError);
            setIsLoading(false);
          } else {
            setError(null);
            setData((prev) => {
              if (
                savedEqualityFn.current &&
                newData !== undefined &&
                savedEqualityFn.current(prev, newData as T)
              ) {
                return prev;
              }
              return newData;
            });
            setIsLoading(false);
          }
        }
      );

      return unsubscribe;
    }
    executeLocal(true); // initial fetch
    if (interval !== null) {
      const intervalId = setInterval(() => executeLocal(false), interval);
      return () => clearInterval(intervalId);
    }

    return undefined;
  }, [interval, executeLocal, isPaused, key]);

  const refresh = useCallback(() => {
    if (key) {
      setIsLoading(true);
      pollingManager.refresh(key).catch(() => {
        setIsLoading(false);
      });
    } else {
      executeLocal(true);
    }
  }, [executeLocal, key]);

  return { data, error, isLoading, refresh };
};
