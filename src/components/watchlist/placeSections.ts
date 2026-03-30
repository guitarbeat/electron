import { useMemo } from 'react';
import type { Place, PlaceSuggestion } from '../../shared/types.ts';

export interface PlaceSections {
  toTry: Place[];
  pinned: Place[];
  visited: Place[];
  suggestions: PlaceSuggestion[];
}

export const buildPlaceSections = (
  places: Place[],
  pendingSuggestions: PlaceSuggestion[]
): PlaceSections => {
  const sections = useMemo(() => {
    const toTry: Place[] = [];
    const pinned: Place[] = [];
    const visited: Place[] = [];

    places.forEach((place) => {
      if (typeof place.lat === 'number' && typeof place.lng === 'number') {
        pinned.push(place);
      } else if (place.visitedAt) {
        visited.push(place);
      } else {
        toTry.push(place);
      }
    });

    return {
      toTry,
      pinned,
      visited,
      suggestions: pendingSuggestions,
    };
  }, [places, pendingSuggestions]);

  return sections;
};
