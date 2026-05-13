import type { Place, PlaceSuggestion } from '../../../shared/types.ts';
import { buildCollectionSections, type CollectionSections } from '../../../utils/index.ts';

export type PlaceSections = CollectionSections<Place, PlaceSuggestion>;

export const buildPlaceSections = (
  places: Place[],
  pendingSuggestions: PlaceSuggestion[] = []
): PlaceSections => {
  return buildCollectionSections(
    places,
    pendingSuggestions,
    (place) => Boolean(place.visitedAt)
  );
};
