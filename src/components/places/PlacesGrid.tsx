import React, { memo } from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import PlaceCard from "./PlaceCard.tsx";
import type { Place } from "../../shared/types.ts";
import PlacesEmptyState from "./PlacesEmptyState.tsx";

interface PlacesGridProps {
  places: Place[];
  emptyStateHint: string;
  canEdit: boolean;
  isSubmitting: boolean;
  activeCardId: string | null;
  onCardTap: (place: Place) => void;
  onCardKeyDown: (
    event: React.KeyboardEvent<HTMLDivElement>,
    place: Place,
  ) => void;
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
  onCardKeyDown,
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
          <div
            key={place.id}
            id={`place-card-${place.id}`}
            onClick={() => onCardTap(place)}
            onKeyDown={(event) => onCardKeyDown(event, place)}
            role="button"
            aria-label={`View details for ${place.name}`}
            tabIndex={0}
            style={{
              cursor: "pointer",
            }}
          >
            <PlaceCard
              place={place}
              canEdit={canEdit}
              isSubmitting={isSubmitting}
              isActive={activeCardId === place.id}
              onMarkVisited={onMarkVisited}
              onMarkUnvisited={onMarkUnvisited}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </div>
        ))
      ) : (
        <PlacesEmptyState hint={emptyStateHint} />
      )}
    </ChromaCollectionGrid>
  );
};

export default memo(PlacesGrid);
