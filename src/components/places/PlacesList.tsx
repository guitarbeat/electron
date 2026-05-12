import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser, useToast } from '@/app/useProviders';
import { usePlaces } from '@/hooks/places';
import ConfirmDialog from '@/ui/ConfirmDialog';
import {
  CollectionEmptyState,
  CollectionGrid,
  CollectionSection,
} from '@/ui/CollectionLayout';
import type { Place, PlaceSuggestion } from '../../shared/types.ts';
import type { PlacesMapHandle } from './PlacesMap.tsx';
import PlaceCard from './PlaceCard.tsx';
import PlaceEditModal from './PlaceEditModal.tsx';
import { buildPlaceSections } from './lib/placeSections.ts';
import { usePlaceSuggestions } from '@/hooks/places';

const PlacesList: React.FC = () => {
  const mapRef = useRef<PlacesMapHandle>(null);
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const {
    places,
    isLoading,
    isSubmitting,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    addPlace,
    removePlace,
    updatePlace,
    markVisited,
    markUnvisited,
    retrySync,
  } = usePlaces(currentUser);

  const {
    pendingSuggestions,
    addPlaceSuggestion,
    acceptPlaceSuggestion,
    rejectPlaceSuggestion,
    isDegraded: isSuggestionsDegraded,
    isSyncBlocked: isSuggestionsSyncBlocked,
    syncWarning: suggestionsSyncWarning,
    retrySync: retrySuggestionsSync,
  } = usePlaceSuggestions(isLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const [placeToEdit, setPlaceToEdit] = useState<Place | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sections = useMemo(() => buildPlaceSections(places, pendingSuggestions), [places, pendingSuggestions]);
  const pinnedCount = useMemo(
    () =>
      places.filter((place) => typeof place.lat === 'number' && typeof place.lng === 'number').length,
    [places]
  );

  const allPlaces = useMemo(
    () => [...sections.queue, ...sections.completed],
    [sections.queue, sections.completed]
  );

  const handleCardTap = useCallback((place: Place) => {
    if (typeof place.lat === 'number' && typeof place.lng === 'number') {
      mapRef.current?.flyTo(place.lng, place.lat);
    }
    clearTimeout(activeTimerRef.current);
    setActiveCardId(place.id);
    activeTimerRef.current = setTimeout(() => setActiveCardId(null), 2500);
  }, []);

  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, place: Place) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCardTap(place);
      }
    },
    [handleCardTap]
  );

  useEffect(() => () => clearTimeout(activeTimerRef.current), []);

  const handleAcceptSuggestion = useCallback(
    async (suggestion: PlaceSuggestion) => {
      if (!currentUser) return;
      setProcessingSuggestionId(suggestion.id);
      try {
        await addPlace(suggestion.name, suggestion.notes);
        await acceptPlaceSuggestion(suggestion.id, currentUser);
        showToast({ message: `"${suggestion.name}" added to places!`, type: 'success' });
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : 'Failed to accept suggestion',
          type: 'error',
        });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [acceptPlaceSuggestion, addPlace, currentUser, showToast]
  );

  const handleRejectSuggestion = useCallback(
    async (suggestionId: string, name: string) => {
      if (!currentUser) return;
      setProcessingSuggestionId(suggestionId);
      try {
        await rejectPlaceSuggestion(suggestionId, currentUser);
        showToast({ message: `"${name}" rejected.`, type: 'info' });
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : 'Failed to reject suggestion',
          type: 'error',
        });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [currentUser, rejectPlaceSuggestion, showToast]
  );

  const handleAddAction = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || isAdding) return;
    if (!currentUser) {
      showToast({ message: 'Pick Aaron or Electra to edit shared places.', type: 'info' });
      return;
    }
    setIsAdding(true);
    setSuggestionError(null);
    try {
      await addPlace(query);
      setSearchQuery('');
      showToast({ message: `"${query}" added!`, type: 'success' });
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Failed to add place');
      showToast({ message: 'Failed to add place', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  }, [addPlace, currentUser, isAdding, searchQuery, showToast]);

  const handleSuggestAction = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || isSuggesting) return;
    setIsSuggesting(true);
    setSuggestionError(null);
    try {
      await addPlaceSuggestion(query);
      setSearchQuery('');
      showToast({ message: `"${query}" suggested for review!`, type: 'success' });
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Failed to suggest place');
      showToast({ message: 'Failed to suggest place', type: 'error' });
    } finally {
      setIsSuggesting(false);
    }
  }, [addPlaceSuggestion, isSuggesting, searchQuery, showToast]);

  const confirmDelete = useCallback(async () => {
    if (!placeToDelete) return;
    const deleted = placeToDelete;
    try {
      await removePlace(deleted.id);
      showToast({ message: `"${deleted.name}" removed!`, type: 'info' });
    } catch {
      showToast({ message: 'Failed to remove place', type: 'error' });
    } finally {
      setPlaceToDelete(null);
    }
  }, [placeToDelete, removePlace, showToast]);

  const renderPlaceGrid = useCallback(
    (placesToRender: Place[], emptyState: string) => (
      <CollectionGrid
        className="watchlist-content places-grid"
        minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
      >
        {placesToRender.length > 0 ? (
          placesToRender.map((place) => (
            <div
              key={place.id}
              id={`place-card-${place.id}`}
              onClick={() => handleCardTap(place)}
              onKeyDown={(event) => handleCardKeyDown(event, place)}
              role="button"
              tabIndex={0}
              style={{
                cursor: 'pointer',
              }}
            >
              <PlaceCard
                place={place}
                canEdit={Boolean(currentUser)}
                isSubmitting={isSubmitting}
                isActive={activeCardId === place.id}
                onMarkVisited={markVisited}
                onMarkUnvisited={markUnvisited}
                onDelete={setPlaceToDelete}
                onEdit={setPlaceToEdit}
              />
            </div>
          ))
        ) : (
          <CollectionEmptyState className="places-empty-state">
            <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>🗺️</span>
            <strong className="places-empty-state__title">No places yet</strong>
            <span className="places-empty-state__hint">{emptyState}</span>
          </CollectionEmptyState>
        )}
      </CollectionGrid>
    ),
    [
      activeCardId,
      currentUser,
      handleCardKeyDown,
      handleCardTap,
      isSubmitting,
      markUnvisited,
      markVisited,
      setPlaceToDelete,
      setPlaceToEdit,
    ]
  );

  const hasPlaces = allPlaces.length > 0;
  const showEmptyState = !isLoading && !hasPlaces;

  return (
    <div className="watchlist-container places-container">
      {/* ... (rest of the file remains same until TO TRY section) */}
      
      {/* TO TRY section */}
      {sections.queue.length > 0 && (
        <CollectionSection heading="To Try">
          {renderPlaceGrid(sections.queue, 'Search above to add your first spot')}
        </CollectionSection>
      )}

      {/* VISITED section */}
      {sections.completed.length > 0 && (
        <CollectionSection heading="Visited" tone="completed">
          {renderPlaceGrid(sections.completed, 'No visited places yet')}
        </CollectionSection>
      )}

      {/* Modals */}
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

      {placeToEdit && (
        <PlaceEditModal
          place={placeToEdit}
          onSave={async (id, updates) => { await updatePlace(id, updates); }}
          onClose={() => setPlaceToEdit(null)}
        />
      )}
    </div>
  );
};

export default memo(PlacesList);
