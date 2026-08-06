import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mutateScope, readScope, retryScopeSync } from "@/services/state";
import type {
  StateScope,
  StateScopeDataMap,
} from "@/services/state/stateTypes";
import { areDeeplyEqual } from "@/utils";
import { User } from "@/shared/types";

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
  const queryClient = useQueryClient();

  const {
    data: snapshot,
    error: queryError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [scope],
    queryFn: () => readScope(scope),
    refetchInterval: isPaused ? false : pollingInterval,
    refetchOnWindowFocus: !isPaused,
    // Disable structural sharing so our existing areDeeplyEqual guard in the
    // setData effect is the single source of truth for identity checks.
    structuralSharing: false,
  });

  const error = queryError instanceof Error ? queryError : null;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const polledData = useMemo(() => (snapshot?.data as T[]) ?? [], [snapshot]);
  const [data, setData] = useState<T[]>(polledData);
  const mutationsInFlightRef = useRef(0);

  useEffect(() => {
    if (mutationsInFlightRef.current > 0) {
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
  }, [polledData, snapshot?.blocked, snapshot?.degraded]);

  const performMutation = useCallback(
    async (op: string, payload: unknown, optimisticData: T[]) => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      setIsSubmitting(true);
      mutationsInFlightRef.current += 1;
      setData(optimisticData);
      try {
        const nextSnapshot = await mutateScope(scope, {
          op,
          payload,
          optimisticData: optimisticData as StateScopeDataMap[CollectionScope],
        });
        setData(nextSnapshot.data as T[]);
        // Invalidate the TanStack Query cache so any subscribers pick up the
        // fresh data from the server on next refetch.
        await queryClient.invalidateQueries({ queryKey: [scope] });
        if (nextSnapshot.degraded) {
          throw new Error(
            nextSnapshot.warning ??
              "Change was kept locally because shared sync is unavailable. Retry sync when you are back online.",
          );
        }
        return true;
      } finally {
        mutationsInFlightRef.current -= 1;
        setIsSubmitting(false);
      }
    },
    [currentUser, queryClient, scope],
  );

  const retrySync = useCallback(async () => {
    await retryScopeSync(scope);
    void refetch();
  }, [refetch, scope]);

  return {
    data,
    isLoading,
    isSubmitting,
    error,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    refresh: refetch,
    retrySync,
    performMutation,
  };
};
