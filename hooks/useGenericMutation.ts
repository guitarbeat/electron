import { useState, useCallback, useRef } from 'react';

export interface MutationState<T> {
  data: T;
  error: Error | null;
  isLoading: boolean;
  isSubmitting: boolean;
  refresh: () => Promise<void>;
}

export interface MutationOptions<T> {
  key: string;
  isPaused?: boolean;
  pollingInterval?: number;
  equalityFn?: (prev: T, next: T) => boolean;
}

export interface MutationConfig<TData, TMutationResult = void> {
  fetchData: () => Promise<TData>;
  saveData: (data: TData) => Promise<void>;
  options?: MutationOptions<TData>;
  onMutationStart?: () => void;
  onMutationEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useGenericMutation = <TData, TMutationResult = void>({
  fetchData,
  saveData,
  options,
  onMutationStart,
  onMutationEnd,
  onError,
}: MutationConfig<TData, TMutationResult>) => {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const mutationLockRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, onError]);

  const performMutation = useCallback(
    async (mutationFn: (latestData: TData) => TData): Promise<void> => {
      const mutation = (async () => {
        try {
          await mutationLockRef.current;
        } catch {
          // Allow next mutation to proceed
        }

        setIsSubmitting(true);
        isSubmittingRef.current = true;
        onMutationStart?.();

        try {
          const latestData = await fetchData();
          const updatedData = mutationFn(latestData);
          await saveData(updatedData);
          setData(updatedData);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Mutation failed');
          setError(error);
          onError?.(error);
          throw error;
        } finally {
          setIsSubmitting(false);
          isSubmittingRef.current = false;
          onMutationEnd?.();
        }
      })();

      mutationLockRef.current = mutation;
      return mutation;
    },
    [fetchData, saveData, onMutationStart, onMutationEnd, onError]
  );

  const addItem = useCallback(
    async (item: TData extends Array<infer U> ? U : never) => {
      if (!Array.isArray(data)) {
        throw new Error('addItem can only be used with array data');
      }
      await performMutation((latestData) => [...latestData, item] as TData);
    },
    [data, performMutation]
  );

  const removeItem = useCallback(
    async (predicate: (item: TData extends Array<infer U> ? U : never) => boolean) => {
      if (!Array.isArray(data)) {
        throw new Error('removeItem can only be used with array data');
      }
      await performMutation((latestData) => 
        (latestData as any[]).filter(predicate) as TData
      );
    },
    [data, performMutation]
  );

  const updateItem = useCallback(
    async (
      predicate: (item: TData extends Array<infer U> ? U : never) => boolean,
      updates: Partial<TData extends Array<infer U> ? U : never>
    ) => {
      if (!Array.isArray(data)) {
        throw new Error('updateItem can only be used with array data');
      }
      await performMutation((latestData) =>
        (latestData as any[]).map((item) =>
          predicate(item) ? { ...item, ...updates } : item
        ) as TData
      );
    },
    [data, performMutation]
  );

  return {
    data,
    error,
    isLoading,
    isSubmitting,
    refresh,
    performMutation,
    addItem,
    removeItem,
    updateItem,
  };
};
