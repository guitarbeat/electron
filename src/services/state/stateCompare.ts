import { areDeeplyEqual } from "../../utils/index.ts";
import type { ScopeSnapshot } from "./stateTypes";

/**
 * Fast path when version + metadata match; still compares data if the reference changed.
 * Safe when the API bumps version on every data mutation (including 304 outbox replay in stateClient).
 */
export const areScopeSnapshotsEqual = <T>(
  prev: ScopeSnapshot<T> | undefined,
  next: ScopeSnapshot<T>,
): boolean => {
  if (prev === next) {
    return true;
  }

  if (!prev) {
    return false;
  }

  if (
    prev.version &&
    next.version &&
    prev.version === next.version &&
    prev.degraded === next.degraded &&
    prev.blocked === next.blocked &&
    prev.warning === next.warning
  ) {
    if (prev.data === next.data) {
      return true;
    }
    return areDeeplyEqual(prev.data, next.data);
  }

  return areDeeplyEqual(prev, next);
};
