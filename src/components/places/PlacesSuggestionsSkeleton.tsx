import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import { PLACES_GRID_CLASS, PLACES_GRID_MIN_COL } from "@/utils/workspaceConfig";

const PlacesSuggestionsSkeleton = () => (
  <ChromaCollectionGrid
    className={PLACES_GRID_CLASS}
    minColumnWidth={PLACES_GRID_MIN_COL}
    aria-hidden="true"
  >
    {["a", "b"].map((key) => (
      <div key={key} className="places-suggestion-skeleton skeleton" />
    ))}
  </ChromaCollectionGrid>
);

export default PlacesSuggestionsSkeleton;
