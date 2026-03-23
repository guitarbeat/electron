import React, { useState, useCallback, memo } from 'react';
import { useUser, useToast } from '@/app/providers';
import { usePlaces } from '@/hooks/usePlaces';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import SubNav from '@/ui/SubNav';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { Input } from '@/ui/FormFields';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid, WorkspacePanels } from '@/ui/CollectionLayout';
import SyncBanner from '@/components/ui/SyncBanner';
import PlacesMap from './PlacesMap';
import { CheckIcon, PlusIcon, TrashIcon, Spinner, MagicWandIcon } from '@/common/icons';
import { colors, spacing, typography, radius } from '@/theme/tokens';
import type { Place, PlaceContentTab, PlaceSortMode } from '@/shared/types';

const PLACE_TABS: { id: PlaceContentTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'queue', label: 'Queue' },
  { id: 'visited', label: 'Visited' },
];

const PLACE_SORT_OPTIONS: { id: PlaceSortMode; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'name', label: 'A-Z' },
];

interface PlacesTopControlsProps {
  contentTab: PlaceContentTab;
  setContentTab: (tab: PlaceContentTab) => void;
  sortMode: PlaceSortMode;
  setSortMode: (mode: PlaceSortMode) => void;
  tabCounts: Record<PlaceContentTab, number>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onPickRandom: () => void;
  canSurprise: boolean;
  isAdding: boolean;
  isSuggesting: boolean;
  suggestionError: string | null;
  queueCount: number;
  visitedCount: number;
  canEdit: boolean;
}

const PlacesTopControls: React.FC<PlacesTopControlsProps> = ({
  contentTab,
  setContentTab,
  sortMode,
  setSortMode,
  tabCounts,
  searchQuery,
  setSearchQuery,
  onSubmit,
  onPickRandom,
  canSurprise,
  isAdding,
  isSuggesting,
  suggestionError,
  queueCount,
  visitedCount,
  canEdit,
}) => {
  return (
    <section
      className="workspace-control-panel ui-control-surface places-top-controls"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      }}
    >
      <div className="workspace-control-panel__header">
        <p className="workspace-control-panel__eyebrow">Dates</p>
        <h2 className="workspace-control-panel__title">Plan the next date</h2>
      </div>

      <div className="workspace-control-panel__meta" aria-label="Date spots overview">
        <span className="workspace-control-panel__pill">{queueCount} queued</span>
        <span className="workspace-control-panel__pill">{visitedCount} visited</span>
      </div>

      <SubNav
        tabs={PLACE_TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: tabCounts[tab.id] ?? 0,
        }))}
        activeTabId={contentTab}
        onTabChange={(id) => setContentTab(id as PlaceContentTab)}
        chips={PLACE_SORT_OPTIONS}
        activeChipId={sortMode}
        onChipChange={(id) => setSortMode(id as PlaceSortMode)}
        variant="underlined"
        mode="segmented"
      />

      <div
        className="places-top-controls__toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          width: '100%',
        }}
      >
        <form
          className="places-top-controls__search-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          style={{ display: 'flex', gap: spacing.sm, flex: 1 }}
        >
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Place name"
            aria-label="Place name"
            fullWidth
          />
          {searchQuery.trim() && (
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={isAdding || isSuggesting || !canEdit}
              isLoading={isAdding || isSuggesting}
              title="Add or suggest place"
              aria-label="Add or suggest place"
              style={{ minWidth: '44px' }}
            >
              {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
            </Button>
          )}
        </form>

        <Button
          type="button"
          variant="ghost"
          onClick={onPickRandom}
          disabled={isAdding || isSuggesting || !canSurprise}
          title="Surprise me"
          aria-label="Pick a random place"
          style={{
            minWidth: '44px',
            opacity: canSurprise && !isAdding && !isSuggesting ? 1 : 0.5,
          }}
        >
          <MagicWandIcon style={{ width: 18, height: 18 }} />
        </Button>
      </div>

      {suggestionError && (
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: `${colors.error}12`,
            border: `1px solid ${colors.error}33`,
            borderRadius: radius.md,
            color: colors.error,
            fontSize: typography.presets.bodySm.fontSize,
            lineHeight: typography.presets.bodySm.lineHeight,
          }}
        >
          {suggestionError}
        </div>
      )}
    </section>
  );
};

interface PlaceCardProps {
  place: Place;
  canEdit: boolean;
  isSubmitting: boolean;
  onMarkVisited: (id: string) => void;
  onMarkUnvisited: (id: string) => void;
  onDelete: (place: Place) => void;
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
  canEdit,
  isSubmitting,
  onMarkVisited,
  onMarkUnvisited,
  onDelete,
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
      className={`place-item-card${isVisited ? ' place-item-card--visited' : ''}`}
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
              disabled={isSubmitting || isActionLoading || !canEdit}
              aria-label={isVisited ? `Mark ${place.name} as not visited` : `Mark ${place.name} as visited`}
            >
              {isActionLoading ? '…' : isVisited ? 'Unmark' : 'Been here!'}
            </button>
            <button
              type="button"
              className="place-item-delete-btn"
              onClick={handleDelete}
              disabled={isSubmitting || !canEdit}
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

  const queueCount = places.filter((p) => !p.visitedAt).length;
  const visitedCount = places.filter((p) => p.visitedAt).length;
  const allCount = places.length;
  
  const tabCounts: Record<PlaceContentTab, number> = {
    all: allCount,
    queue: queueCount,
    visited: visitedCount,
  };

  const filteredByTab = 
    contentTab === 'all'
      ? places
      : contentTab === 'queue'
        ? places.filter((p) => !p.visitedAt)
        : places.filter((p) => p.visitedAt);

  const filtered = searchQuery.trim()
    ? filteredByTab.filter((p) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredByTab;

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'name') {
      return a.name.localeCompare(b.name);
    }
    // recent (default)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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

  const handleAddAction = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || isAdding) return;

    if (!currentUser) {
      showToast({
        message: 'Pick Aaron or Electra to edit shared places.',
        type: 'info',
      });
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
  }, [searchQuery, isAdding, currentUser, addPlace, setSearchQuery, showToast]);

  const handleRandomPlacePick = useCallback(() => {
    const availablePlaces = contentTab === 'visited' 
      ? places.filter(p => p.visitedAt)
      : places.filter(p => !p.visitedAt);
    
    if (availablePlaces.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * availablePlaces.length);
    const randomPlace = availablePlaces[randomIndex];
    
    showToast({ 
      message: `🎲 How about "${randomPlace.name}"?`, 
      type: 'info' 
    });
  }, [contentTab, places, showToast]);

  const renderControls = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
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
        canSurprise={contentTab === 'queue' ? places.filter(p => !p.visitedAt).length > 0 : places.filter(p => p.visitedAt).length > 0}
        isAdding={isAdding}
        isSuggesting={isSuggesting}
        suggestionError={suggestionError}
        queueCount={queueCount}
        visitedCount={visitedCount}
        canEdit={Boolean(currentUser)}
      />
    </div>
  );

  const renderSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </>
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
      }}
    >
      <WorkspacePanels
        className="places-workspace"
        desktopColumns="repeat(auto-fit, minmax(320px, 1fr))"
        first={renderControls()}
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
        renderSkeleton()
      ) : (
        <CollectionGrid
          className="places-grid"
          minColumnWidth="clamp(12rem, 26vw, 16.5rem)"
          style={{ 
            gap: spacing.lg,
            marginTop: spacing.md
          }}
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
