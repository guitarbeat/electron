import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pollingManager, usePolling } from "@/services/polling";
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
  const polledIds = new Set(polled.map(getCollectionItemId).filter(Boolean));
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
        await pollingManager.refresh(scope);
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
    [currentUser, scope],
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
