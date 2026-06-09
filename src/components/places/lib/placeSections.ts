import type { Place, PlaceSuggestion } from '@/shared/types';
import { buildCollectionSections, type CollectionSections } from '../../../utils/workspace.ts';

export type PlaceSortOrder = 'recent' | 'alpha';

export type PlaceSections = CollectionSections<Place, PlaceSuggestion>;

function sortPlaces(places: Place[], sortOrder: PlaceSortOrder): Place[] {
  const sorted = [...places];
  switch (sortOrder) {
    case 'alpha':
      return sorted.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      );
    case 'recent':
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export const buildPlaceSections = (
  places: Place[],
  pendingSuggestions: PlaceSuggestion[] = [],
  sortOrder: PlaceSortOrder = 'recent',
): PlaceSections => {
  const sorted = sortPlaces(places, sortOrder);
  return buildCollectionSections(sorted, pendingSuggestions, (place) =>
    Boolean(place.visitedAt),
  );
};
