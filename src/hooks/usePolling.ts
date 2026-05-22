// FIX: Implemented the usePolling custom hook to resolve compilation errors.
import { useState, useEffect, useRef, useCallback } from 'react';
import { pollingManager } from '@/services/polling';


export const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number | null,
  equalityFn?: (prev: T | undefined, next: T) => boolean,
  options: { isPaused?: boolean; key?: string; allowNull?: boolean } = {}
) => {
  const { isPaused = false, key, allowNull = false } = options;

  const [data, setData] = useState<T | undefined>(() => {
    if (key) {
      const cached = pollingManager.getData(key);
      if (cached !== undefined) return cached as T;
    }
    return undefined;
  });

  const [error, setError] = useState<Error | null>(() => {
    if (key) {
      const cachedError = pollingManager.getError(key);
      if (cachedError) {
        return cachedError instanceof Error ? cachedError : new Error(String(cachedError));
      }
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
    if (isInitialLoad && !dataRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await savedFetchFn.current();

      if (result === undefined || (!allowNull && result === null)) {
        throw new Error('Fetched data is null or undefined');
      }

      setData((prevData) => {
        if (savedEqualityFn.current && savedEqualityFn.current(prevData, result)) {
          return prevData;
        }
        return result;
      });
    } catch (e) {
      console.error(`Polling execution failed${key ? ` for ${key}` : ''}:`, e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [allowNull, key]);

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    if (key && interval !== null) {
      const proxyFetch = () => savedFetchFn.current();

      const unsubscribe = pollingManager.subscribe(
        key,
        proxyFetch,
        interval,
        (newData: unknown, newError: unknown) => {
          if (newError) {
            setError(newError instanceof Error ? newError : new Error(String(newError)));
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
              return newData as T;
            });
            setIsLoading(false);
          }
        },
        { allowNull }
      );

      return unsubscribe;
    }
    executeLocal(true);
    if (interval !== null) {
      const intervalId = setInterval(() => executeLocal(false), interval);
      return () => clearInterval(intervalId);
    }

    return undefined;
  }, [allowNull, executeLocal, interval, isPaused, key]);

  const refresh = useCallback(() => {
    if (key && interval !== null) {
      setIsLoading(true);
      setError(null);
      pollingManager.refresh(key).catch((error: unknown) => {
        console.error(`Polling refresh failed for ${key}:`, error);
        setError(error instanceof Error ? error : new Error(String(error)));
        setIsLoading(false);
      });
    } else {
      executeLocal(true);
    }
  }, [executeLocal, interval, key]);

  return { data, error, isLoading, refresh };
};
