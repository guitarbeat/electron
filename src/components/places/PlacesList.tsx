import React, { memo, useCallback, useMemo, useState } from 'react';
import { useUser, useToast } from '@/app/providers';
import { usePlaces } from '@/hooks/usePlaces';
import Card from '@/ui/Card';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid, WorkspacePanels } from '@/ui/CollectionLayout';
import SyncBanner from '@/components/ui/SyncBanner';
import { colors, spacing, typography } from '@/theme/tokens';
import type { Place } from '@/shared/types';
import PlacesMap from './PlacesMap';
import PlaceCard from './PlaceCard';
import PlacesTopControls from './PlacesTopControls';
import { buildPlaceSections } from './placeSections';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);

  const sections = useMemo(() => buildPlaceSections(places), [places]);

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

  return (
    <div className="places-container" style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSubmit={handleAddAction}
              isAdding={isAdding}
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
    </div>
  );
};

export default memo(PlacesList);
