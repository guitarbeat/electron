/**
 * The shared inbox is whatever the server returned.
 * An empty list is a real empty thread. Sample lines belong only to explicit mock mode.
 */
export function selectVisibleMessages<T>(
  remote: readonly T[] | null | undefined,
): readonly T[] {
  return remote ?? [];
}
