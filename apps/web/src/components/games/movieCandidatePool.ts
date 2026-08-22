export const getUnwatchedCandidatePool = <T extends { watchedBy: unknown[] }>(
  items: T[],
): T[] => {
  const queue = items.filter((item) => item.watchedBy.length < 2);
  return queue.length > 0 ? queue : items;
};

export const selectCandidateSubset = <T extends { id: string }>(
  candidates: T[],
  selectedIds: ReadonlySet<string>,
): T[] => {
  if (selectedIds.size === 0) return candidates;
  const selected = candidates.filter((candidate) => selectedIds.has(candidate.id));
  return selected.length > 0 ? selected : candidates;
};
