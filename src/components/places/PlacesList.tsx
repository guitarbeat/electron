import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useUser, useToast } from '@/app/providers';
import { usePlaces } from '@/hooks/places';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import SyncBanner from '../ui/SyncBanner.tsx';
import { colors, spacing, radius, typography, motion } from '../../theme/tokens.ts';
import type { Place, PlaceSuggestion } from '../../shared/types.ts';
import PlacesMap, { type PlacesMapHandle } from './PlacesMap.tsx';
import PlaceCard from './PlaceCard.tsx';
import PlaceSuggestionCard from './PlaceSuggestionCard.tsx';
import PlaceEditModal from './PlaceEditModal.tsx';
import { buildPlaceSections } from './placeSections.ts';
import { usePlaceSuggestions } from '@/hooks/places';

const glassStyle: React.CSSProperties = {
  background: 'rgba(18, 11, 6, 0.72)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const PlacesList: React.FC = () => {
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

  const sections = useMemo(() => buildPlaceSections(places, pendingSuggestions), [places, pendingSuggestions]);

  // All places combined for the overlay tray
  const allPlaces = useMemo(
    () => [...sections.queue, ...sections.visited],
    [sections.queue, sections.visited]
  );

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
    if (!currentUser) {
      showToast({ message: 'Pick Aaron or Electra to suggest places.', type: 'info' });
      return;
    }
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
  }, [addPlaceSuggestion, currentUser, isSuggesting, searchQuery, showToast]);

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

  return (
    <div
      className="places-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: radius.xl,
      }}
    >
      {/* Sync banner at top */}
      {(isDegraded || isSuggestionsDegraded) && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
          <SyncBanner
            isBlocked={isSyncBlocked || isSuggestionsSyncBlocked}
            onRetry={async () => {
              await Promise.all([retrySync(), retrySuggestionsSync()]);
            }}
            label={
              isSyncBlocked || isSuggestionsSyncBlocked
                ? 'A shared places update conflicted with local edits. Refresh and retry.'
                : syncWarning || suggestionsSyncWarning || 'Places changes are being kept locally until shared sync recovers.'
            }
          />
        </div>
      )}

      {/* Full-height map */}
      <PlacesMap
        places={places}
        canEdit={Boolean(currentUser)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSubmitSearch={handleAddAction}
        onSuggestPlace={handleSuggestAction}
        isAdding={isAdding}
        isSuggesting={isSuggesting}
        suggestionError={suggestionError}
        onUpdatePlace={updatePlace}
        onAddPlace={addPlace}
        style={{ flex: 1, minHeight: 0 }}
      />

      {/* Suggestions banner */}
      {sections.suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: spacing.md,
            right: spacing.md,
            zIndex: 15,
            ...glassStyle,
            borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
            padding: spacing.sm,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
            maxHeight: '30vh',
            overflowY: 'auto',
          }}
        >
          <span style={{ ...typography.presets.eyebrow, color: colors.accentLight, fontSize: typography.fontSize['2xs'] }}>
            {sections.suggestions.length} suggestion{sections.suggestions.length === 1 ? '' : 's'} pending
          </span>
          <div style={{ display: 'flex', gap: spacing.sm, overflowX: 'auto', paddingBottom: spacing.xs }}>
            {sections.suggestions.map((suggestion) => (
              <div key={suggestion.id} style={{ flex: '0 0 auto', width: 180 }}>
                <PlaceSuggestionCard
                  suggestion={suggestion}
                  onAccept={() => handleAcceptSuggestion(suggestion)}
                  onReject={() => handleRejectSuggestion(suggestion.id, suggestion.name)}
                  canRespond={Boolean(currentUser)}
                  isProcessing={processingSuggestionId === suggestion.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlaid card tray at bottom */}
      {isLoading && places.length === 0 ? (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 15,
            ...glassStyle,
            borderTop: `1px solid ${colors.border}`,
            padding: `${spacing.sm} ${spacing.md}`,
            display: 'flex',
            gap: spacing.md,
            overflowX: 'auto',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: '0 0 auto', width: 140 }}>
              <MovieCardSkeleton />
            </div>
          ))}
        </div>
      ) : allPlaces.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 15,
            ...glassStyle,
            borderTop: `1px solid ${colors.border}`,
            padding: `${spacing.sm} ${spacing.md} ${spacing.md}`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: spacing.xs }}>
            <div
              style={{
                width: 32,
                height: 4,
                borderRadius: 2,
                background: colors.textTertiary,
                opacity: 0.4,
              }}
            />
          </div>

          {/* Section labels + scrollable cards */}
          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              paddingBottom: spacing.xs,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {sections.queue.length > 0 && (
              <>
                <div
                  style={{
                    flex: '0 0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                    ...typography.presets.eyebrow,
                    color: colors.accentLight,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: '0.08em',
                    paddingRight: spacing.xs,
                  }}
                >
                  TO TRY
                </div>
                {sections.queue.map((place) => (
                  <div
                    key={place.id}
                    style={{
                      flex: '0 0 auto',
                      width: 140,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <PlaceCard
                      place={place}
                      canEdit={Boolean(currentUser)}
                      isSubmitting={isSubmitting}
                      onMarkVisited={markVisited}
                      onMarkUnvisited={markUnvisited}
                      onDelete={setPlaceToDelete}
                      onEdit={setPlaceToEdit}
                    />
                  </div>
                ))}
              </>
            )}

            {sections.visited.length > 0 && (
              <>
                <div
                  style={{
                    flex: '0 0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                    ...typography.presets.eyebrow,
                    color: colors.textTertiary,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: '0.08em',
                    paddingRight: spacing.xs,
                  }}
                >
                  VISITED
                </div>
                {sections.visited.map((place) => (
                  <div
                    key={place.id}
                    style={{
                      flex: '0 0 auto',
                      width: 140,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <PlaceCard
                      place={place}
                      canEdit={Boolean(currentUser)}
                      isSubmitting={isSubmitting}
                      onMarkVisited={markVisited}
                      onMarkUnvisited={markUnvisited}
                      onDelete={setPlaceToDelete}
                      onEdit={setPlaceToEdit}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ) : null}

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
