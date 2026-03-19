import React, { useState, useCallback, useRef, memo } from 'react';
import { useUser, useToast } from '@/context';
import { usePlaces } from '@/hooks/usePlaces';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import SubNav from '@/ui/SubNav';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import PlacesMap from './PlacesMap';
import { PlusIcon, TrashIcon, CheckIcon } from '@/common/icons';
import { colors, spacing, typography, motion, shadows } from '@/design-system';
import type { Place } from '@/types';

type PlaceFilter = 'want' | 'visited';

const PlacesList: React.FC = () => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
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

  const [filter, setFilter] = useState<PlaceFilter>('want');
  const [nameInput, setNameInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  usePlacesAutocomplete(nameInputRef, (name, lat, lng) => {
    setNameInput(name);
    setPendingCoords(typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null);
  });

  const wantCount = places.filter((p) => !p.visitedAt).length;
  const visitedCount = places.filter((p) => p.visitedAt).length;
  const filtered = filter === 'want' ? places.filter((p) => !p.visitedAt) : places.filter((p) => p.visitedAt);
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: spacing.md }}>
        {[1, 2, 3].map((i) => <MovieCardSkeleton key={i} />)}
      </div>
    </div>
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

      <div 
        className="places-workspace"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: spacing.xl,
          alignItems: 'start'
        }}
      >
        <Card
          variant="elevated"
          style={{
            padding: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <h2 style={{ ...typography.presets.titleSm, margin: 0, fontSize: '1.25rem' }}>Add new spot</h2>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <Input
              ref={nameInputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Place name or address"
              aria-label="Place name"
              fullWidth
            />
            <Input
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Notes (optional)"
              aria-label="Notes"
              fullWidth
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!nameInput.trim() || isSubmitting}
              isLoading={isSubmitting}
              style={{ alignSelf: 'flex-start', minWidth: '140px' }}
            >
              <PlusIcon style={{ width: 16, height: 16 }} />
              Add spot
            </Button>
          </form>
        </Card>

        <Card
          variant="default"
          style={{
            padding: spacing.md,
            height: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
            border: `1px solid ${colors.borderSubtle}`,
            overflow: 'hidden'
          }}
        >
          <PlacesMap places={places} />
          {places.length > 0 && !hasMappedPlaces && (
            <p style={{ ...typography.presets.caption, color: colors.textTertiary, textAlign: 'center', margin: 0 }}>
              Use search results to pin spots on the map.
            </p>
          )}
        </Card>
      </div>

      <div style={{ marginTop: spacing.md }}>
        <SubNav
          tabs={[
            { id: 'want', label: 'Dream spots', count: wantCount },
            { id: 'visited', label: 'Been together', count: visitedCount },
          ]}
          activeTabId={filter}
          onTabChange={(id) => setFilter(id as PlaceFilter)}
          variant="underlined"
        />

        {isLoading && places.length === 0 ? (
          renderSkeleton()
        ) : (
          <div 
            className="places-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: spacing.lg,
              marginTop: spacing.md
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: spacing['3xl'], color: colors.textTertiary, ...typography.presets.bodySm }}>
                {filter === 'want' ? 'No date spots yet. Add one above!' : 'No visited spots yet.'}
              </div>
            ) : (
              filtered.map((place, index) => (
                <Card 
                  key={place.id}
                  variant={place.visitedAt ? 'default' : 'elevated'}
                  style={{ 
                    padding: spacing.md, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: spacing.sm,
                    animation: `slide-up ${motion.duration.normal} ${motion.easing.easeOut} ${index * 0.05}s both`,
                    border: place.visitedAt ? `1px solid ${colors.borderSubtle}` : `1px solid ${colors.accent}20`,
                    boxShadow: place.visitedAt ? 'none' : shadows.card
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <h3 style={{ ...typography.presets.bodySm, fontWeight: 600, margin: 0 }}>{place.name}</h3>
                      {place.visitedAt && (
                        <span style={{ ...typography.presets.caption, color: colors.success, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckIcon style={{ width: 12, height: 12 }} />
                          Visited
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: spacing.xs }}>
                      {place.visitedAt ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markUnvisited(place.id)}
                          disabled={isSubmitting}
                          style={{ fontSize: '0.75rem', padding: `2px ${spacing.sm}` }}
                        >
                          Mark unvisited
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markVisited(place.id)}
                          disabled={isSubmitting}
                          style={{ fontSize: '0.75rem', padding: `2px ${spacing.sm}` }}
                        >
                          Mark visited
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPlaceToDelete(place)}
                        disabled={isSubmitting}
                        aria-label={`Delete ${place.name}`}
                        style={{ padding: spacing.xs, color: colors.textTertiary }}
                      >
                        <TrashIcon style={{ width: 16, height: 16 }} />
                      </Button>
                    </div>
                  </div>
                  {place.notes && (
                    <p style={{ ...typography.presets.caption, color: colors.textSecondary, margin: 0, lineBreak: 'anywhere' }}>
                      {place.notes}
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>
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

