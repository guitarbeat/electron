import React, { memo } from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import PlaceCard from "./PlaceCard";
import type { Place } from "@/shared/types";
import { WorkspaceSectionEmpty } from "@/components/ui/WorkspaceEmptyState";
import { PLACES_GRID_CLASS, PLACES_GRID_MIN_COL } from "@/utils/workspaceConfig";

interface PlacesGridProps {
  places: Place[];
  variant: "queue" | "completed";
  canEdit: boolean;
  isSubmitting: boolean;
  activeCardId: string | null;
  onCardTap: (place: Place) => void;
  onMarkVisited: (id: string) => void;
  onMarkUnvisited: (id: string) => void;
  onDelete: (place: Place) => void;
  onEdit: (place: Place) => void;
}

const PlacesGrid: React.FC<PlacesGridProps> = ({
  places,
  variant,
  canEdit,
  isSubmitting,
  activeCardId,
  onCardTap,
  onMarkVisited,
  onMarkUnvisited,
  onDelete,
  onEdit,
}) => {
  return (
    <ChromaCollectionGrid
      className={PLACES_GRID_CLASS}
      minColumnWidth={PLACES_GRID_MIN_COL}
    >
      {places.length > 0 ? (
        places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            canEdit={canEdit}
            isSubmitting={isSubmitting}
            isActive={activeCardId === place.id}
            onActivate={() => onCardTap(place)}
            onMarkVisited={onMarkVisited}
            onMarkUnvisited={onMarkUnvisited}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))
      ) : (
        <WorkspaceSectionEmpty tab="places" variant={variant} />
      )}
    </ChromaCollectionGrid>
  );
};

export default memo(PlacesGrid);
