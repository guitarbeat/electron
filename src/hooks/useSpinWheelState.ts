import { useCallback, useEffect, useRef } from 'react';
import type { User } from '@/shared/types';
import { usePolling } from '@/services/polling';
import { mutateScope, readScope } from '@/services/stateClient';
import type { DailySpinRecord } from '@/services/stateTypes';
import { appendSpinHistory, SPIN_HISTORY_MAX } from '@/components/spinWheel/spinWheelEngine';
import { areDeeplyEqual } from '@/utils';

const POLLING_INTERVAL = 15000;

export interface SpinWheelSyncState {
  history: string[];
  daily: DailySpinRecord | null;
  degraded: boolean;
  warning?: string;
}

const spinWheelDataEqual = (
  prev: SpinWheelSyncState | undefined,
  next: SpinWheelSyncState
): boolean => {
  if (!prev) {
    return false;
  }
  return (
    areDeeplyEqual(prev.history, next.history) &&
    areDeeplyEqual(prev.daily, next.daily) &&
    prev.degraded === next.degraded &&
    prev.warning === next.warning
  );
};

export const useSpinWheelState = (currentUser: User | null, isPaused: boolean = false) => {
  const readSpinWheel = useCallback(async (): Promise<SpinWheelSyncState> => {
    const [historySnap, dailySnap] = await Promise.all([
      readScope('spinHistory'),
      readScope('dailySpin'),
    ]);

    const warnings = [historySnap.warning, dailySnap.warning].filter(
      (w): w is string => typeof w === 'string' && w.length > 0
    );
    const warning =
      warnings.length === 0
        ? undefined
        : [...new Set(warnings)].join(' ');

    return {
      history: historySnap.data,
      daily: dailySnap.data,
      degraded: historySnap.degraded || dailySnap.degraded,
      warning,
    };
  }, []);

  const {
    data: snapshot,
    isLoading,
    refresh,
  } = usePolling(readSpinWheel, POLLING_INTERVAL, spinWheelDataEqual, {
    key: 'spinWheel',
    isPaused,
  });

  const snapshotRef = useRef(snapshot);
  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const recordSpin = useCallback(
    async (movieId: string, movieTitle: string): Promise<boolean> => {
      if (!currentUser) {
        return false;
      }

      const prev = snapshotRef.current;
      const prevHistory = prev?.history ?? [];
      const optimisticHistory = appendSpinHistory(
        prevHistory,
        movieTitle,
        SPIN_HISTORY_MAX
      );
      const now = new Date().toISOString();
      const optimisticDaily: DailySpinRecord = {
        date: now.slice(0, 10),
        movieId,
        movieTitle,
        spunBy: currentUser,
        createdAt: now,
      };

      try {
        await mutateScope('spinHistory', {
          op: 'record_pick',
          payload: { title: movieTitle },
          optimisticData: optimisticHistory,
        });
        await mutateScope('dailySpin', {
          op: 'record_daily',
          payload: { movieId, movieTitle },
          optimisticData: optimisticDaily,
        });
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [currentUser, refresh]
  );

  return {
    history: snapshot?.history ?? [],
    daily: snapshot?.daily ?? null,
    degraded: snapshot?.degraded ?? false,
    warning: snapshot?.warning,
    isLoading,
    refresh,
    recordSpin,
  };
};
