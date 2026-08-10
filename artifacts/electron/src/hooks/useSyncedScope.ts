import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mutateScope, readScope, retryScopeSync } from "@/services/state";
import type {
  StateScope,
  StateScopeDataMap,
} from "@/services/state/stateTypes";

interface SyncedScopeOptions {
  pollingInterval?: number;
  isPaused?: boolean;
}

interface ScopeMutation<TScope extends StateScope> {
  op: string;
  payload: unknown;
  optimisticData: StateScopeDataMap[TScope];
}

export const useSyncedScope = <TScope extends StateScope>(
  scope: TScope,
  options: SyncedScopeOptions = {},
) => {
  const { pollingInterval = 15000, isPaused = false } = options;
  const queryClient = useQueryClient();
  const [mutationsInFlight, setMutationsInFlight] = useState(0);
  const query = useQuery({
    queryKey: [scope],
    queryFn: () => readScope(scope),
    refetchInterval: isPaused ? false : pollingInterval,
    refetchOnWindowFocus: !isPaused,
    structuralSharing: false,
  });

  const mutate = useCallback(
    async (mutation: ScopeMutation<TScope>) => {
      setMutationsInFlight((count) => count + 1);
      try {
        const snapshot = await mutateScope(scope, mutation);
        await queryClient.invalidateQueries({ queryKey: [scope] });
        return snapshot;
      } finally {
        setMutationsInFlight((count) => count - 1);
      }
    },
    [queryClient, scope],
  );

  const retrySync = useCallback(async () => {
    await retryScopeSync(scope);
    void query.refetch();
  }, [query, scope]);

  const snapshot = query.data;
  return {
    data: snapshot?.data,
    snapshot,
    error: query.error instanceof Error ? query.error : null,
    isLoading: query.isLoading,
    isMutating: mutationsInFlight > 0,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    refresh: query.refetch,
    retrySync,
    mutate,
  };
};
