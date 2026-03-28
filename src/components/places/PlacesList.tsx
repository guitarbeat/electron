import React, { memo, useCallback, useMemo, useState } from 'react';
import { useUser, useToast } from '@/app/providers';
import { usePlaces } from '@/hooks/usePlaces';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid } from '@/ui/CollectionLayout';
import SyncBanner from '../ui/SyncBanner.tsx';
import { colors, spacing, typography } from '../../theme/tokens.ts';
import type { Place, PlaceSuggestion } from '../../shared/types.ts';
import PlacesMap from './PlacesMap.tsx';
import PlaceCard from './PlaceCard.tsx';
import PlaceSuggestionCard from './PlaceSuggestionCard.tsx';
import PlaceEditModal from './PlaceEditModal.tsx';
import { buildPlaceSections } from './placeSections.ts';
import { usePlaceSuggestions } from '../../hooks/usePlaceSuggestions.ts';

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
    acceptPlaceSuggestion,
    rejectPlaceSuggestion,
    isLoading: isSuggestionsLoading,
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
    if (!query || isAdding) {
      return;
    }

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
    if (!query || isSuggesting) {
      return;
    }

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
    if (!placeToDelete) {
      return;
    }

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

  const renderPlaceSection = useCallback(
    ({
      title,
      placesToRender,
      emptyState,
    }: {
      title: string;
      placesToRender: Place[];
      emptyState: string;
    }) => (
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: spacing.sm,
            paddingInline: spacing.xs,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <span style={{ ...typography.presets.eyebrow, color: colors.accentLight }}>
              {title}
            </span>
            <h2
              style={{
                margin: 0,
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.xl,
                lineHeight: typography.lineHeight.snug,
              }}
            >
              {placesToRender.length} {placesToRender.length === 1 ? 'place' : 'places'}
            </h2>
          </div>
        </div>
        <CollectionGrid
          className="places-grid"
          minColumnWidth="clamp(12rem, 26vw, 16.5rem)"
          style={{ gap: spacing.lg }}
        >
          {placesToRender.length > 0 ? (
            placesToRender.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                canEdit={Boolean(currentUser)}
                isSubmitting={isSubmitting}
                onMarkVisited={markVisited}
                onMarkUnvisited={markUnvisited}
                onDelete={setPlaceToDelete}
                onEdit={setPlaceToEdit}
              />
            ))
          ) : (
            <CollectionEmptyState>{emptyState}</CollectionEmptyState>
          )}
        </CollectionGrid>
      </section>
    ),
    [currentUser, isSubmitting, markUnvisited, markVisited]
  );

  const renderSuggestionSection = useCallback(
    (suggestionsToRender: PlaceSuggestion[]) => (
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: spacing.sm,
            paddingInline: spacing.xs,
          }}
        >
          <span style={{ ...typography.presets.eyebrow, color: colors.accentLight }}>
            Pending Suggestions
          </span>
          <span style={{ ...typography.presets.caption, color: colors.textTertiary }}>
            {suggestionsToRender.length}
          </span>
        </div>
        <CollectionGrid
          className="places-grid"
          minColumnWidth="clamp(12rem, 26vw, 16.5rem)"
          style={{ gap: spacing.lg }}
        >
          {suggestionsToRender.map((suggestion) => (
            <PlaceSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => handleAcceptSuggestion(suggestion)}
              onReject={() => handleRejectSuggestion(suggestion.id, suggestion.name)}
              canRespond={Boolean(currentUser)}
              isProcessing={processingSuggestionId === suggestion.id}
            />
          ))}
        </CollectionGrid>
      </section>
    ),
    [currentUser, handleAcceptSuggestion, handleRejectSuggestion, processingSuggestionId]
  );

  return (
    <div className="places-container" style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      {(isDegraded || isSuggestionsDegraded) && (
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
      )}

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
      />

      {isLoading && places.length === 0 ? (
        <CollectionGrid
          className="places-grid"
          minColumnWidth="clamp(12rem, 26vw, 16.5rem)"
          style={{ gap: spacing.lg }}
        >
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </CollectionGrid>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2xl'] }}>
          {sections.suggestions.length > 0 && renderSuggestionSection(sections.suggestions)}
          {renderPlaceSection({
            title: 'Queue',
            placesToRender: sections.queue,
            emptyState: 'No places in queue',
          })}
          {renderPlaceSection({
            title: 'Visited',
            placesToRender: sections.visited,
            emptyState: 'No visited places yet',
          })}
        </div>
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
