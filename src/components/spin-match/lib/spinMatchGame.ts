export const MIN_SPIN_SUBSET_SIZE = 1;

export const canSpinFromSubset = (keptCount: number): boolean => keptCount >= MIN_SPIN_SUBSET_SIZE;

export const getSpinSubsetPrompt = (keptCount: number, isDone: boolean): string => {
  if (keptCount <= 0) {
    return 'Keep at least one movie to spin a subset.';
  }

  if (isDone) {
    return `Spin the ${keptCount}-movie subset you picked.`;
  }

  return 'You can stop rating now. The wheel only uses the movies you kept.';
};
