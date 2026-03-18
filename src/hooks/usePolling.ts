import { useState, useEffect, useRef, useCallback } from 'react';
import { pollingManager } from '@/services/PollingManager';

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

  const [error, setError] = useState<unknown>(() => {
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
      console.error('Polling execution failed:', e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [allowNull]);

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
    if (key) {
      setIsLoading(true);
      setError(null);
      pollingManager.refresh(key).catch((error) => {
        console.error('Polling refresh failed:', error);
        setError(error);
        setIsLoading(false);
      });
    } else {
      executeLocal(true);
    }
  }, [executeLocal, key]);

  return { data, error, isLoading, refresh };
};
