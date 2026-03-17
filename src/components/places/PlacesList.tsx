import React, { useState, useCallback, useRef } from 'react';
import { useUser, useToast } from '@/context';
import { usePlaces } from '@/hooks/usePlaces';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import Input from '@/ui/Input';
import SubNav from '@/ui/SubNav';
import ConfirmDialog from '@/ui/ConfirmDialog';
import Skeleton from '@/ui/Skeleton';
import PlacesMap from './PlacesMap';
import { PlusIcon, TrashIcon, CheckIcon } from '@/common/icons';
import { colors, spacing, typography, radius } from '@/design-system/tokens';
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
  const filtered =
    filter === 'want' ? places.filter((p) => !p.visitedAt) : places.filter((p) => p.visitedAt);
  const hasMappedPlaces =
    places.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number').length > 0;

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
      } catch (err) {
        console.error(err);
      }
    },
    [nameInput, notesInput, pendingCoords, isSubmitting, addPlace]
  );

  const confirmDelete = useCallback(async () => {
    if (!placeToDelete) return;

    const deleted = placeToDelete;
    try {
      await removePlace(deleted.id);
      setPlaceToDelete(null);
      showToast({
        message: `Removed "${deleted.name}"`,
        type: 'success',
        onUndo: async () => {
          try {
            await restorePlace(deleted);
            showToast({ message: `Restored "${deleted.name}"`, type: 'success' });
          } catch {
            showToast({ message: 'Failed to undo', type: 'error' });
          }
        },
        duration: 6000,
      });
    } catch (err) {
      console.error(err);
    }
  }, [placeToDelete, removePlace, restorePlace, showToast]);

  if (isLoading && places.length === 0) {
    return (
      <div className="places-page">
        <div className="places-loading">
          <Skeleton variant="text" width="220px" height="1.5rem" />
          <Skeleton variant="text" width="min(100%, 460px)" height="1rem" />
          <Card
            style={{
              padding: spacing.md,
              borderRadius: radius.lg,
              border: `1px solid ${colors.borderSecondary}35`,
            }}
          >
            <Skeleton variant="rectangular" width="100%" height="220px" />
          </Card>
          <Card
            style={{
              padding: spacing.md,
              borderRadius: radius.lg,
              border: `1px solid ${colors.borderSecondary}35`,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}
          >
            <Skeleton variant="rectangular" width="min(100%, 400px)" height="44px" />
            <Skeleton variant="rectangular" width="min(100%, 400px)" height="44px" />
            <Skeleton variant="rectangular" width="140px" height="36px" />
          </Card>
          {[0, 1, 2].map((index) => (
            <Card
              key={`places-skeleton-${index}`}
              style={{
                padding: spacing.md,
                borderRadius: radius.lg,
                border: `1px solid ${colors.borderSecondary}35`,
              }}
            >
              <Skeleton
                variant="text"
                width="50%"
                height="1rem"
                style={{ marginBottom: spacing.xs }}
              />
              <Skeleton variant="text" width="80%" height="0.9rem" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="places-page">
      <header className="places-header">
        <h1 className="places-title">Date spots wishlist</h1>
        <p className="places-subtitle">
          Save dream spots for your next outing, then mark the places you explored together.
        </p>
        <hr className="memory-lane-divider" />
      </header>

      <section className="ui-control-surface places-surface" aria-label="Places map and add form">
        <div className="places-map-block">
          <h2 className="places-surface-title">Map</h2>
          <PlacesMap places={places} />
          {places.length > 0 && !hasMappedPlaces && (
            <p className="places-map-hint">
              Use search results to add coordinates and pin your date spots on the map.
            </p>
          )}
        </div>

        <form onSubmit={handleAdd} className="places-add-form">
          <div className="ui-control-input-shell places-add-input-shell">
            <Input
              ref={nameInputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Place name or address"
              aria-label="Place name"
              className="ui-control-input places-add-input"
            />
          </div>
          <div className="ui-control-input-shell places-add-input-shell">
            <Input
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Notes (optional)"
              aria-label="Notes"
              className="ui-control-input places-add-input"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={!nameInput.trim() || isSubmitting}
            className="places-add-button"
            style={{ fontFamily: typography.fontFamily.body.join(', ') }}
          >
            <PlusIcon style={{ width: 16, height: 16 }} />
            Add place
          </Button>
        </form>
      </section>

      <SubNav
        ariaLabel="Places: filter by list"
        tabs={[
          { id: 'want', label: 'Dream spots', count: wantCount },
          { id: 'visited', label: 'Been together', count: visitedCount },
        ]}
        activeId={filter}
        onSelect={(id) => setFilter(id as PlaceFilter)}
      />

      <ul className="places-items" aria-live="polite">
        {filtered.length === 0 && (
          <li className="places-empty">
            {filter === 'want'
              ? 'No date spots yet. Add one above.'
              : 'No shared spot history yet.'}
          </li>
        )}

        {filtered.map((place) => (
          <li key={place.id}>
            <Card className="places-item-card">
              <div className="places-item-top">
                <div className="places-item-title-wrap">
                  <span className="places-item-title">{place.name}</span>
                  {place.visitedAt && (
                    <span className="places-item-visited">
                      <CheckIcon style={{ width: 12, height: 12 }} />
                      Visited
                    </span>
                  )}
                </div>

                <div className="places-item-actions">
                  {place.visitedAt ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markUnvisited(place.id)}
                      disabled={isSubmitting}
                      className="places-action-btn"
                      style={{ fontFamily: typography.fontFamily.body.join(', ') }}
                    >
                      Mark unvisited
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markVisited(place.id)}
                      disabled={isSubmitting}
                      className="places-action-btn"
                      style={{ fontFamily: typography.fontFamily.body.join(', ') }}
                    >
                      Mark visited
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPlaceToDelete(place)}
                    disabled={isSubmitting}
                    className="places-delete-btn"
                    aria-label={`Delete ${place.name}`}
                  >
                    <TrashIcon style={{ width: 16, height: 16 }} />
                  </Button>
                </div>
              </div>

              {place.notes && <p className="places-item-notes">{place.notes}</p>}
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={!!placeToDelete}
        title="Remove place"
        message={placeToDelete ? `Remove "${placeToDelete.name}" from the list?` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setPlaceToDelete(null)}
      />
    </div>
  );
};

export default PlacesList;
