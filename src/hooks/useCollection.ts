import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePolling } from '@/services/polling';
import { mutateScope, readScope, retryScopeSync } from '@/services/state';
import type { StateScope, StateScopeDataMap } from '@/services/state/stateTypes';
import { areDeeplyEqual } from '@/utils';
import { User } from '@/shared/types';

interface CollectionOptions {
  pollingInterval?: number;
  isPaused?: boolean;
}

type CollectionScope = {
  [K in StateScope]: StateScopeDataMap[K] extends Array<unknown> ? K : never;
}[StateScope];

export const useCollection = <T>(
  scope: CollectionScope,
  currentUser: User | null | undefined,
  options: CollectionOptions = {}
) => {
  const { pollingInterval = 15000, isPaused = false } = options;

  const readFunc = useCallback(() => readScope(scope), [scope]);
  const {
    data: snapshot,
    error,
    isLoading,
    refresh,
  } = usePolling(readFunc, pollingInterval, areDeeplyEqual, {
    key: scope,
    isPaused,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const polledData = useMemo(() => (snapshot?.data as T[]) ?? [], [snapshot]);
  const [data, setData] = useState<T[]>(polledData);

  useEffect(() => {
    setData(polledData);
  }, [polledData]);

  const performMutation = useCallback(
    async (op: string, payload: unknown, optimisticData: T[]) => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      setIsSubmitting(true);
      try {
        const nextSnapshot = await mutateScope(scope, {
          op,
          payload,
          optimisticData: optimisticData as StateScopeDataMap[CollectionScope],
        });
        setData(nextSnapshot.data as T[]);
        refresh();
        return true;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, refresh, scope]
  );

  const retrySync = useCallback(async () => {
    await retryScopeSync(scope);
    refresh();
  }, [refresh, scope]);

  return {
    data,
    isLoading,
    isSubmitting,
    error,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    refresh,
    retrySync,
    performMutation,
  };
};
