import React, { useState, useCallback, memo } from 'react';
import { useUser, useToast } from '@/app/providers';
import { usePlaces } from '@/hooks/usePlaces';
import Card from '@/ui/Card';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid, WorkspacePanels } from '@/ui/CollectionLayout';
import SyncBanner from '@/components/ui/SyncBanner';
import PlacesMap from './PlacesMap';
import PlaceCard from './PlaceCard';
import PlacesTopControls from './PlacesTopControls';
import { spacing, colors } from '@/theme/tokens';
import type { Place, PlaceContentTab, PlaceSortMode } from '@/shared/types';

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
    markVisited,
    markUnvisited,
    retrySync,
  } = usePlaces(currentUser);

  const [contentTab, setContentTab] = useState<PlaceContentTab>('queue');
  const [sortMode, setSortMode] = useState<PlaceSortMode>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);

  const tabCounts: Record<PlaceContentTab, number> = {
    all: places.length,
    queue: places.filter((p) => !p.visitedAt).length,
    visited: places.filter((p) => p.visitedAt).length,
  };

  const filteredByTab =
    contentTab === 'all'
      ? places
      : contentTab === 'queue'
        ? places.filter((p) => !p.visitedAt)
        : places.filter((p) => p.visitedAt);

  const filtered = searchQuery.trim()
    ? filteredByTab.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredByTab;

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'name') return a.name.localeCompare(b.name);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
      setIsSuggesting(false);
    }
  }, [searchQuery, isAdding, currentUser, addPlace, showToast]);

  const handleRandomPlacePick = useCallback(() => {
    const pool =
      contentTab === 'visited'
        ? places.filter((p) => p.visitedAt)
        : places.filter((p) => !p.visitedAt);

    if (pool.length === 0) return;

    const randomPlace = pool[Math.floor(Math.random() * pool.length)];
    showToast({ message: `🎲 How about "${randomPlace.name}"?`, type: 'info' });
  }, [contentTab, places, showToast]);

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

  const canSurprise =
    contentTab === 'visited'
      ? places.some((p) => p.visitedAt)
      : places.some((p) => !p.visitedAt);

  return (
    <div className="places-container">
      <WorkspacePanels
        className="places-workspace"
        desktopColumns="repeat(auto-fit, minmax(320px, 1fr))"
        first={
          <div className="places-controls-column">
            {isDegraded && (
              <SyncBanner
                isBlocked={isSyncBlocked}
                onRetry={() => void retrySync()}
                label={
                  isSyncBlocked
                    ? 'A shared places update conflicted with local edits. Refresh and retry.'
                    : syncWarning || 'Places changes are being kept locally until shared sync recovers.'
                }
              />
            )}
            <PlacesTopControls
              contentTab={contentTab}
              setContentTab={setContentTab}
              sortMode={sortMode}
              setSortMode={setSortMode}
              tabCounts={tabCounts}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSubmit={handleAddAction}
              onPickRandom={handleRandomPlacePick}
              canSurprise={canSurprise}
              isAdding={isAdding}
              isSuggesting={isSuggesting}
              suggestionError={suggestionError}
              canEdit={Boolean(currentUser)}
            />
          </div>
        }
        second={
          <Card
            variant="default"
            className="places-map-card places-map-card--height"
            style={{
              padding: spacing.md,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
              border: `1px solid ${colors.borderSubtle}`,
              overflow: 'hidden',
            }}
          >
            <PlacesMap places={places} />
          </Card>
        }
      />

      {isLoading && places.length === 0 ? (
        <>{[1, 2, 3, 4, 5, 6].map((i) => <MovieCardSkeleton key={i} />)}</>
      ) : (
        <CollectionGrid
          className="places-grid"
          minColumnWidth="clamp(12rem, 26vw, 16.5rem)"
          style={{ gap: spacing.lg, marginTop: spacing.md }}
        >
          {sorted.length > 0 ? (
            sorted.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                canEdit={Boolean(currentUser)}
                isSubmitting={isSubmitting}
                onMarkVisited={markVisited}
                onMarkUnvisited={markUnvisited}
                onDelete={setPlaceToDelete}
              />
            ))
          ) : (
            <CollectionEmptyState>
              {searchQuery.trim()
                ? 'No places found matching your search'
                : contentTab === 'visited'
                  ? 'No visited places yet'
                  : contentTab === 'queue'
                    ? 'No places in queue'
                    : 'No places added yet'}
            </CollectionEmptyState>
          )}
        </CollectionGrid>
      )}

      {placeToDelete && (
        <ConfirmDialog
          isOpen={!!placeToDelete}
          title="Remove place"
          message={`Are you sure you want to remove "${placeToDelete.name}" from your list?`}
          onConfirm={confirmDelete}
          onCancel={() => setPlaceToDelete(null)}
          confirmText="Remove"
          variant="danger"
        />
      )}
    </div>
  );
};

export default memo(PlacesList);
