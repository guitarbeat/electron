import type { Place, PlaceSuggestion } from "@/shared/types";
import {
  buildCollectionSections,
  compareCreatedAtDesc,
  compareStringsAlpha,
  type CollectionSections,
} from "../../../utils/workspace.ts";

export type PlaceSortOrder = "recent" | "alpha";

export type PlaceSections = CollectionSections<Place, PlaceSuggestion>;

function sortPlaces(places: Place[], sortOrder: PlaceSortOrder): Place[] {
  const sorted = [...places];
  switch (sortOrder) {
    case "alpha":
      return sorted.sort((a, b) => compareStringsAlpha(a.name, b.name));
    case "recent":
    default:
      return sorted.sort(compareCreatedAtDesc);
  }
}

export const buildPlaceSections = (
  places: Place[],
  pendingSuggestions: PlaceSuggestion[] = [],
  sortOrder: PlaceSortOrder = "recent",
): PlaceSections => {
  const sorted = sortPlaces(places, sortOrder);
  return buildCollectionSections(sorted, pendingSuggestions, (place) =>
    Boolean(place.visitedAt),
  );
};
