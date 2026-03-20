import React, { useState, useCallback, useRef, memo } from 'react';
import { useUser, useToast } from '@/context';
import { usePlaces } from '@/hooks/usePlaces';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import SubNav from '@/ui/SubNav';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { Input } from '@/ui/FormFields';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid, WorkspacePanels } from '@/ui/CollectionLayout';
import PlacesMap from './PlacesMap';
import { CheckIcon, PlusIcon, TrashIcon } from '@/common/icons';
import { colors, spacing, typography, motion } from '@/design-system';
import type { Place } from '@/types';

type PlaceFilter = 'all' | 'queue' | 'visited';

interface PlacesTopControlsProps {
  nameInput: string;
  notesInput: string;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
}

const PlacesTopControls: React.FC<PlacesTopControlsProps> = ({
  nameInput,
  notesInput,
  nameInputRef,
  isSubmitting,
  onNameChange,
  onNotesChange,
  onSubmit,
}) => {
  return (
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
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Input
          ref={nameInputRef}
          value={nameInput}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Place name or address"
          aria-label="Place name"
          fullWidth
        />
        <Input
          value={notesInput}
          onChange={(event) => onNotesChange(event.target.value)}
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
  );
};

interface PlaceCardProps {
  place: Place;
  isSubmitting: boolean;
  onMarkVisited: (id: string) => void;
  onMarkUnvisited: (id: string) => void;
  onDelete: (place: Place) => void;
  animationIndex: number;
}

function getPlaceIcon(name: string): string {
  const lower = name.toLowerCase();
  if (/beach|ocean|sea|lake|river|bay|shore|coast|surf|swim/.test(lower)) return '🏖️';
  if (/park|garden|trail|forest|nature|woods|hike|botanical|grove|meadow/.test(lower)) return '🌿';
  if (/restaurant|diner|bistro|brasserie|grill|steakhouse|bbq|sushi|pizza|tacos|ramen|burger/.test(lower)) return '🍽️';
  if (/cafe|coffee|espresso|bakery|patisserie|pastry|boulangerie|tea/.test(lower)) return '☕';
  if (/bar|pub|brewery|taproom|cocktail|lounge|nightclub|club|wine/.test(lower)) return '🍻';
  if (/museum|gallery|art|exhibit|modern/.test(lower)) return '🎨';
  if (/theater|theatre|cinema|movies|show|performance|concert|opera|ballet/.test(lower)) return '🎭';
  if (/mountain|hill|peak|summit|climb|rock|canyon|cliff/.test(lower)) return '⛰️';
  if (/shop|store|market|mall|boutique|vintage|thrift/.test(lower)) return '🛍️';
  if (/gym|fitness|yoga|pilates|spa|wellness|sauna/.test(lower)) return '🧘';
  if (/hotel|resort|airbnb|hostel|motel|inn/.test(lower)) return '🏨';
  if (/zoo|aquarium|safari|wildlife|animal/.test(lower)) return '🦁';
  if (/library|bookstore|books|reading/.test(lower)) return '📚';
  if (/airport|station|terminal|train/.test(lower)) return '✈️';
  if (/bridge|landmark|tower|castle|palace/.test(lower)) return '🏰';
  if (/island|cove|lagoon|waterfall/.test(lower)) return '🌊';
  return '📍';
}

function getPlaceGradient(name: string): { h1: number; h2: number; h3: number } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = Math.imul(31, hash) + name.charCodeAt(i) | 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 55) % 360;
  const h3 = (h1 + 110) % 360;
  return { h1, h2, h3 };
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSubmitting,
  onMarkVisited,
  onMarkUnvisited,
  onDelete,
  animationIndex,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const isVisited = Boolean(place.visitedAt);
  const icon = getPlaceIcon(place.name);
  const { h1, h2, h3 } = getPlaceGradient(place.name);
  const hasCoords = typeof place.lat === 'number' && typeof place.lng === 'number';

  const handleVisitToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting || isActionLoading) return;
    setIsActionLoading(true);
    try {
      if (isVisited) {
        await onMarkUnvisited(place.id);
      } else {
        await onMarkVisited(place.id);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(place);
  };

  const visitedDate = place.visitedAt
    ? new Date(place.visitedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div
      className={`place-item-card slide-up${isVisited ? ' place-item-card--visited' : ''}`}
      style={{ animationDelay: `${animationIndex * 0.05}s` }}
    >
      <div className="place-item-poster-wrap">
        <div
          className="place-item-cover"
          style={{
            background: `
              radial-gradient(circle at 28% 22%, rgba(255,255,255,0.18) 0%, transparent 40%),
              conic-gradient(from 200deg at 45% 55%,
                hsl(${h1}, 55%, 38%) 0deg,
                hsl(${h2}, 60%, 30%) 120deg,
                hsl(${h3}, 50%, 34%) 240deg,
                hsl(${h1}, 55%, 38%) 360deg
              )
            `,
          } as React.CSSProperties}
          aria-hidden="true"
        >
          <span className="place-item-cover__icon">{icon}</span>
          <span className="place-item-cover__sparkle place-item-cover__sparkle--tl">✦</span>
          <span className="place-item-cover__sparkle place-item-cover__sparkle--br">✦</span>
          {hasCoords && (
            <span className="place-item-cover__pin">📍</span>
          )}
        </div>

        {isVisited && (
          <div className="place-item-visited-badge" aria-label="Visited">
            <CheckIcon style={{ width: 10, height: 10 }} />
            {visitedDate ?? 'Visited'}
          </div>
        )}

        <div className="place-item-overlay">
          <div className="place-item-info">
            <h3 className="place-item-title">{place.name}</h3>
            {place.notes && (
              <p className="place-item-notes">{place.notes}</p>
            )}
          </div>

          <div className="place-item-actions">
            <button
              type="button"
              className={`place-item-action-btn${isVisited ? ' place-item-action-btn--unmark' : ' place-item-action-btn--visit'}`}
              onClick={handleVisitToggle}
              disabled={isSubmitting || isActionLoading}
              aria-label={isVisited ? `Mark ${place.name} as not visited` : `Mark ${place.name} as visited`}
            >
              {isActionLoading ? '…' : isVisited ? 'Unmark' : 'Been here!'}
            </button>
            <button
              type="button"
              className="place-item-delete-btn"
              onClick={handleDelete}
              disabled={isSubmitting}
              aria-label={`Remove ${place.name}`}
            >
              <TrashIcon style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
