import React, { useState, useCallback, useRef, memo } from 'react';
import { useUser, useToast } from '@/context';
import { usePlaces } from '@/hooks/usePlaces';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import Card from '@/ui/Card';
import SubNav from '@/ui/SubNav';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid, WorkspacePanels } from '@/ui/CollectionLayout';
import PlacesMap from './PlacesMap';
import PlaceCard from './PlaceCard';
import PlacesTopControls from './PlacesTopControls';
import { colors, spacing, typography, motion } from '@/design-system';
import type { Place } from '@/types';

type PlaceFilter = 'all' | 'queue' | 'visited';

const PlacesList: React.FC = () => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const {
    places,
    isLoading,
    isSubmitting,
    addPlace,
    removePlace,
    restorePlace,
    markVisited,
    markUnvisited,
  } = usePlaces(currentUser);

  const [filter, setFilter] = useState<PlaceFilter>('queue');
  const [nameInput, setNameInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  usePlacesAutocomplete(nameInputRef, (name, lat, lng) => {
    setNameInput(name);
    setPendingCoords(typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null);
  });

  const queueCount = places.filter((p) => !p.visitedAt).length;
  const visitedCount = places.filter((p) => p.visitedAt).length;
  const allCount = places.length;
  const filtered =
    filter === 'all'
      ? places
      : filter === 'queue'
        ? places.filter((p) => !p.visitedAt)
        : places.filter((p) => p.visitedAt);
  const hasMappedPlaces = places.some((p) => typeof p.lat === 'number' && typeof p.lng === 'number');

  const handleAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const name = nameInput.trim();
      if (!name || isSubmitting) return;

      try {
        await addPlace(
          name,
          notesInput.trim() || undefined,
          pendingCoords?.lat,
          pendingCoords?.lng
        );
        setNameInput('');
        setNotesInput('');
        setPendingCoords(null);
        showToast({ message: `"${name}" added to list!`, type: 'success' });
      } catch (err) {
        showToast({ message: 'Failed to add place', type: 'error' });
        console.error(err);
      }
    },
    [nameInput, notesInput, pendingCoords, isSubmitting, addPlace, showToast]
  );

  const confirmDelete = useCallback(async () => {
    if (!placeToDelete) return;

    const deleted = placeToDelete;
    try {
      await removePlace(deleted.id);
      setPlaceToDelete(null);
      showToast({
        message: `Removed "${deleted.name}"`,
        type: 'info',
        onUndo: async () => {
          try {
            await restorePlace(deleted);
            showToast({ message: `Restored "${deleted.name}"`, type: 'success' });
          } catch {
            showToast({ message: 'Failed to restore', type: 'error' });
          }
        },
        duration: 5000,
      });
    } catch (err) {
      showToast({ message: 'Failed to remove', type: 'error' });
      console.error(err);
    }
  }, [placeToDelete, removePlace, restorePlace, showToast]);

  const renderSkeleton = () => (
    <CollectionGrid minColumnWidth="280px" gap={spacing.md}>
      {[1, 2, 3].map((i) => <MovieCardSkeleton key={i} />)}
    </CollectionGrid>
  );

  return (
    <div 
      className="places-container"
      style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: `0 0 ${spacing['3xl']}`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xl,
        animation: `fade-in ${motion.duration.slow} ${motion.easing.easeOut} both`
      }}
    >
      <header style={{ marginBottom: spacing.md }}>
        <h1 style={{ ...typography.presets.titleMd, color: colors.textPrimary, marginBottom: spacing.xs }}>
          Date spot wishlist
        </h1>
        <p style={{ ...typography.presets.bodySm, color: colors.textSecondary, maxWidth: '600px' }}>
          Save dream spots for your next outing, then mark the places you explored together.
        </p>
      </header>

      <WorkspacePanels
        isMobile={isMobile}
        className="places-workspace"
        mobileClassName="places-workspace"
        desktopColumns="repeat(auto-fit, minmax(320px, 1fr))"
        first={
          <PlacesTopControls
            nameInput={nameInput}
            notesInput={notesInput}
            nameInputRef={nameInputRef}
            isSubmitting={isSubmitting}
            onNameChange={setNameInput}
            onNotesChange={setNotesInput}
            onSubmit={handleAdd}
          />
        }
        second={
          <Card
            variant="default"
            style={{
              padding: spacing.md,
              height: '340px',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
              border: `1px solid ${colors.borderSubtle}`,
              overflow: 'hidden',
            }}
          >
            <PlacesMap places={places} />
            {places.length > 0 && !hasMappedPlaces && (
              <p style={{ ...typography.presets.caption, color: colors.textTertiary, textAlign: 'center', margin: 0 }}>
                Use search results to pin spots on the map.
              </p>
            )}
          </Card>
        }
      />

      <div style={{ marginTop: spacing.md }}>
        <SubNav
          tabs={[
            { id: 'all', label: 'All', count: allCount },
            { id: 'queue', label: 'Queue', count: queueCount },
            { id: 'visited', label: 'Visited', count: visitedCount },
          ]}
          activeTabId={filter}
          onTabChange={(id) => setFilter(id as PlaceFilter)}
          variant="underlined"
        />

        {isLoading && places.length === 0 ? (
          renderSkeleton()
        ) : (
          <CollectionGrid
            className="places-grid"
            minColumnWidth="300px"
            style={{ 
              gap: spacing.lg,
              marginTop: spacing.md
            }}
          >
            {filtered.length === 0 ? (
              <CollectionEmptyState style={{ color: colors.textTertiary, ...typography.presets.bodySm }}>
                {filter === 'visited' ? 'No visited spots yet.' : 'No date spots yet. Add one above!'}
              </CollectionEmptyState>
            ) : (
              filtered.map((place, index) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isSubmitting={isSubmitting}
                  animationIndex={index}
                  onMarkVisited={markVisited}
                  onMarkUnvisited={markUnvisited}
                  onDelete={setPlaceToDelete}
                />
              ))
            )}
          </CollectionGrid>
        )}
      </div>

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
