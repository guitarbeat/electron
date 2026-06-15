import type { Place, PlaceSuggestion } from '@/shared/types';
import { buildCollectionSections, type CollectionSections } from '../../../utils/workspace.ts';

export type PlaceSections = CollectionSections<Place, PlaceSuggestion>;

export const buildPlaceSections = (
  places: Place[],
  pendingSuggestions: PlaceSuggestion[] = [],
): PlaceSections => {
  return buildCollectionSections(places, pendingSuggestions, (place) =>
    Boolean(place.visitedAt),
  );
};
