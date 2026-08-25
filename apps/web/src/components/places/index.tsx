import React, { useState, useCallback } from "react";
import type { Place } from "@/shared/types";
import { usePlaces, usePlaceSuggestions } from "@/hooks/places";
import { useUser } from "@/app/providerContexts";
import { PLACES_GRID_MIN_COL } from "@/utils/workspaceConfig";
import { 
  CollectionEmptyState, 
  SyncBanner, 
  ConfirmDialog, 
  CollectionGrid, 
  CardTiltShell, 
  Card, 
  CardTiltSheen,
  Button,
  MediaCardPosterWrap,
  MediaPoster,
  MediaCardTitle,
} from "@/components/ui";
import { PlacesEmptyIllustration } from "@/components/ui/EmptyStateIllustrations";

export const PlaceCard: React.FC<{
  place: Place;
  canEdit: boolean;
  onMarkVisited: (id: string) => void;
  onMarkUnvisited: (id: string) => void;
  onDelete: (place: Place) => void;
}> = ({ place, canEdit, onDelete, onMarkVisited, onMarkUnvisited }) => (
  <div className={`movie-item-container ${place.visitedAt ? "movie-item-container--watched" : ""}`}>
    <CardTiltShell>
      <Card variant="default" className="movie-item-card chroma-card" style={{ padding: 0, overflow: "hidden" }}>
        <CardTiltSheen />
        <MediaCardPosterWrap className="movie-item-poster-wrap">
          <MediaPoster
            title={place.name}
            posterUrl={place.imageUrl}
            id={place.id}
          />
          <div className="movie-item-title-overlay" aria-hidden="true">
            <MediaCardTitle className="movie-item-title-overlay__title">
              {place.name}
            </MediaCardTitle>
            <div className="movie-item-title-overlay__meta">
              {place.visitedAt ? (
                <span className="movie-item-meta__rating" style={{ color: "var(--color-accent)" }}>Visited</span>
              ) : (
                <span className="movie-item-meta__rating">Not visited</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="movie-item-details-hit-area"
            onClick={() => {
              if (canEdit) {
                if (place.visitedAt) {
                  onMarkUnvisited(place.id);
                } else {
                  onMarkVisited(place.id);
                }
              }
            }}
            aria-label={`Toggle visited status for "${place.name}"`}
          />

          {canEdit && (
            <div className="place-item-actions-overlay" style={{ position: 'absolute', left: 0, right: 0, zIndex: 10, pointerEvents: 'auto', bottom: 'auto', top: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'flex-end', padding: '0.75rem', opacity: 1 }}>
              {place.visitedAt ? (
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onMarkUnvisited(place.id); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Unmark</Button>
              ) : (
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onMarkVisited(place.id); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Mark Visited</Button>
              )}
              <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(place); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Delete</Button>
            </div>
          )}
        </MediaCardPosterWrap>
      </Card>
    </CardTiltShell>
  </div>
);

export const PlacesList: React.FC<{ isPaused?: boolean }> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
    
  

  const {
    places: allPlaces,
    isLoading,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    retrySync,
    removePlace,
    markVisited,
    markUnvisited
  } = usePlaces(currentUser, isPaused);

  const {
    isDegraded: isSuggestionsDegraded,
    isSyncBlocked: isSuggestionsSyncBlocked,
    syncWarning: suggestionsSyncWarning,
    retrySync: retrySuggestionsSync,
  } = usePlaceSuggestions(isPaused);

  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);

  const handleMarkVisited = useCallback((id: string) => {
    markVisited(id);
  }, [markVisited]);

  const handleMarkUnvisited = useCallback((id: string) => {
    markUnvisited(id);
  }, [markUnvisited]);

  const confirmDelete = useCallback(() => {
    if (placeToDelete) {
      removePlace(placeToDelete.id);
      setPlaceToDelete(null);
    }
  }, [placeToDelete, removePlace]);

  const hasPlaces = allPlaces.length > 0;
  const showEmptyState = !isLoading && !hasPlaces;

  return (
    <section id="library-places" className="library-places" aria-label="Places">
      <h2 className="workspace-section-heading library-places-heading">
        <span className="workspace-section-heading__content">
          <span className="workspace-section-heading__label">Places</span>
        </span>
      </h2>
      <div className="watchlist-container places-container">
        {isDegraded && (
          <SyncBanner
            isBlocked={isSyncBlocked}
            onRetry={() => void retrySync()}
            label={isSyncBlocked ? "A shared places change conflicted with local edits. Refresh and retry." : syncWarning || "Places changes are being kept locally until shared sync recovers."}
          />
        )}
        {isSuggestionsDegraded && (
          <SyncBanner
            isBlocked={isSuggestionsSyncBlocked}
            onRetry={() => void retrySuggestionsSync()}
            label={suggestionsSyncWarning || "Place suggestion changes are being kept locally."}
          />
        )}

        {showEmptyState && (
          <CollectionGrid className="watchlist-content places-grid" minColumnWidth={PLACES_GRID_MIN_COL}>
            <CollectionEmptyState className="places-empty-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gridColumn: "1 / -1" }}>
              <PlacesEmptyIllustration />
              <strong className="places-empty-state__title" style={{ fontSize: "1.25rem", color: "var(--color-text-primary)", marginBottom: "0.5rem", marginTop: "1rem" }}>No places yet</strong>
              <span className="places-empty-state__hint">Your saved places will appear here. Search above to add some.</span>
            </CollectionEmptyState>
          </CollectionGrid>
        )}

        {hasPlaces && (
          <CollectionGrid className="watchlist-content places-grid" minColumnWidth={PLACES_GRID_MIN_COL}>
            {allPlaces.map((place: Place) => (
              <div key={place.id}>
                <PlaceCard
                  place={place}
                  canEdit={Boolean(currentUser)}
                  onMarkVisited={handleMarkVisited}
                  onMarkUnvisited={handleMarkUnvisited}
                  onDelete={setPlaceToDelete}
                />
              </div>
            ))}
          </CollectionGrid>
        )}

        {placeToDelete && (
          <ConfirmDialog
            isOpen={Boolean(placeToDelete)}
            title="Remove place"
            message={`Are you sure you want to remove "${placeToDelete.name}" from your list?`}
            onConfirm={confirmDelete}
            onCancel={() => setPlaceToDelete(null)}
            confirmText="Remove"
            variant="danger"
          />
        )}
      </div>
    </section>
  );
};
