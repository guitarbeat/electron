import React, { memo } from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import PlaceCard from "./PlaceCard";
import type { Place } from "@/shared/types";
import PlacesEmptyState from "./PlacesEmptyState";

interface PlacesGridProps {
  places: Place[];
  emptyStateHint: string;
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
  emptyStateHint,
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
      className="watchlist-content places-grid"
      minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
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
        <PlacesEmptyState hint={emptyStateHint} />
      )}
    </ChromaCollectionGrid>
  );
};

export default memo(PlacesGrid);
