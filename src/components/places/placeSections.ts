import type { Place, PlaceSuggestion } from '../../shared/types.ts';

export interface PlaceSections {
  suggestions: PlaceSuggestion[];
  queue: Place[];
  visited: Place[];
}

export const buildPlaceSections = (
  places: Place[],
  pendingSuggestions: PlaceSuggestion[] = []
): PlaceSections => ({
  suggestions: pendingSuggestions,
  queue: places.filter((place) => !place.visitedAt),
  visited: places.filter((place) => Boolean(place.visitedAt)),
});
