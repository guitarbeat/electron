import { useState, useCallback, useRef, useEffect } from 'react';
import { unifiedPollingManager } from '../../services/core/UnifiedPollingManager.ts';

interface UsePollingOptions<T> {
  interval?: number;
  cacheTTL?: number;
  enabled?: boolean;
  onError?: (error: any) => void;
}

export function useUnifiedPolling<T>(
  fetchFn: () => Promise<T>,
  key: string,
  options: UsePollingOptions<T> = {}
) {
  const {
    interval = 5000,
    cacheTTL,
    enabled = true,
    onError
  } = options;

  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  
  const savedFetchFn = useRef(fetchFn);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Update fetch function ref when it changes
  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  // Subscribe to polling
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const unsubscribe = unifiedPollingManager.subscribe(
      key,
      () => savedFetchFn.current(),
      interval,
      (newData, newError) => {
        if (newError) {
          setError(newError);
          setData(undefined);
          onError?.(newError);
        } else {
          setData(newData);
          setError(null);
        }
        setIsLoading(false);
      },
      { cacheTTL }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [key, interval, cacheTTL, enabled, onError]);

  const refresh = useCallback(() => {
    return unifiedPollingManager.refresh(key);
  }, [key]);

  const clearCache = useCallback(() => {
    unifiedPollingManager.clearCache(key);
  }, [key]);

  return {
    data,
    isLoading,
    error,
    refresh,
    clearCache
  };
}
