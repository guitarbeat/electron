export function getNextListIndex(
  currentIndex: number,
  direction: "next" | "previous",
  resultCount: number,
): number {
  if (resultCount <= 0) {
    return -1;
  }

  if (direction === "next") {
    if (currentIndex < 0 || currentIndex >= resultCount - 1) {
      return 0;
    }

    return currentIndex + 1;
  }

  if (currentIndex <= 0) {
    return resultCount - 1;
  }

  return currentIndex - 1;
}

export function getListEnterSelectionIndex(
  activeIndex: number,
  resultCount: number,
): number {
  if (resultCount <= 0) {
    return -1;
  }

  if (activeIndex >= 0 && activeIndex < resultCount) {
    return activeIndex;
  }

  return 0;
}
