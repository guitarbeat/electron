import { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncedScope } from "./useSyncedScope";
import type {
  StateScope,
  StateScopeDataMap,
} from "../services/state/stateTypes";
import { areDeeplyEqual } from "../utils";
import { User } from "../shared/types";

interface CollectionOptions {
  pollingInterval?: number;
  isPaused?: boolean;
}

type CollectionScope = {
  [K in StateScope]: StateScopeDataMap[K] extends Array<unknown> ? K : never;
}[StateScope];

const getCollectionItemId = (item: unknown): string | undefined => {
  if (typeof item !== "object" || item === null || !("id" in item)) {
    return undefined;
  }

  const { id } = item as { id: unknown };
  return typeof id === "string" ? id : undefined;
};

const hasLocalOnlyRows = <T>(current: T[], polled: T[]): boolean => {
  // Optimization: Use a single pass loop instead of multi-pass chained array
  // methods (.map().filter()) to build the Set. This eliminates intermediate
  // array allocations and improves performance for large collections.
  const polledIds = new Set<string>();
  for (const item of polled) {
    const id = getCollectionItemId(item);
    if (id) {
      polledIds.add(id);
    }
  }

  return current.some((item) => {
    const id = getCollectionItemId(item);
    return Boolean(id && !polledIds.has(id));
  });
};

export const useCollection = <T>(
  scope: CollectionScope,
  currentUser: User | null | undefined,
  options: CollectionOptions = {},
) => {
  const { pollingInterval = 15000, isPaused = false } = options;
  const {
    data: remoteData,
    snapshot,
    error,
    isLoading,
    isMutating,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    mutate,
  } = useSyncedScope(scope, {
    pollingInterval,
    isPaused,
  });
  const polledData = useMemo(() => (remoteData as T[]) ?? [], [remoteData]);
  const [data, setData] = useState<T[]>(polledData);

  useEffect(() => {
    if (isMutating) {
      return;
    }

    setData((current) => {
      if (areDeeplyEqual(current, polledData)) {
        return current;
      }

      // Avoid overwriting optimistic rows with a stale poll that finished before refresh().
      if (snapshot?.degraded || snapshot?.blocked) {
        if (hasLocalOnlyRows(current, polledData)) {
          return current;
        }
      }

      return polledData;
    });
  }, [isMutating, polledData, snapshot?.blocked, snapshot?.degraded]);

  const performMutation = useCallback(
    async (op: string, payload: unknown, optimisticData: T[]) => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      setData(optimisticData);
      const nextSnapshot = await mutate({
        op,
        payload,
        optimisticData: optimisticData as StateScopeDataMap[CollectionScope],
      });
        setData(nextSnapshot.data as T[]);
      if (nextSnapshot.degraded) {
        throw new Error(
          nextSnapshot.warning ??
            "Change was kept locally because shared sync is unavailable. Retry sync when you are back online.",
        );
      }
      return true;
    },
    [currentUser, mutate],
  );

  return {
    data,
    isLoading,
    isSubmitting: isMutating,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    performMutation,
  };
};
