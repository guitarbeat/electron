const scrollPositions = new Map<string, number>();

export const scrollStorage = {
  getScroll: (key: string): number => scrollPositions.get(key) ?? 0,
  setScroll: (key: string, pos: number): void => {
    scrollPositions.set(key, pos);
  },
  clear: (): void => scrollPositions.clear(),
};
