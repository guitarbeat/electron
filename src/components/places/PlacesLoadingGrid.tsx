import type { FC } from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import { MovieCardSkeleton } from "@/ui/Skeleton";
import WorkspaceTabLoading from "@/components/ui/WorkspaceTabLoading";

const PLACE_SKELETON_KEYS = ["p1", "p2", "p3", "p4"] as const;

const PlacesLoadingGrid: FC = () => (
  <ChromaCollectionGrid
    className="watchlist-content places-grid"
    minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
  >
    <div className="workspace-loading-grid" aria-busy="true">
      <WorkspaceTabLoading emoji="🗺️" label="Loading your places…" />
      <div className="workspace-loading-grid__cards" aria-hidden="true">
        {PLACE_SKELETON_KEYS.map((key) => (
          <MovieCardSkeleton key={key} />
        ))}
      </div>
    </div>
  </ChromaCollectionGrid>
);

export default PlacesLoadingGrid;
