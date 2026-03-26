import type { Place } from '@/shared/types';

export interface PlaceSections {
  queue: Place[];
  visited: Place[];
}

export const buildPlaceSections = (places: Place[]): PlaceSections => ({
  queue: places.filter((place) => !place.visitedAt),
  visited: places.filter((place) => Boolean(place.visitedAt)),
});
