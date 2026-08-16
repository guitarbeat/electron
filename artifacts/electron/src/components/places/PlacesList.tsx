import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser, useToast } from '@/app/useProviders';
import { usePlaces } from '@/hooks/places';
import ConfirmDialog from '@/ui/ConfirmDialog';
import {
  CollectionEmptyState,
  CollectionGrid,
  CollectionSection,
} from '@/ui/CollectionLayout';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CheckIcon, MapPinIcon, MessageIcon } from '../common/Icons.tsx';
import SyncBanner from '../ui/SyncBanner.tsx';
import type { Place, PlaceSuggestion } from '../../shared/types.ts';
import type { PlacesMapHandle } from './PlacesMap.tsx';
import PlaceCard from './PlaceCard.tsx';
import PlaceSuggestionCard from './PlaceSuggestionCard.tsx';
import PlaceEditModal from './PlaceEditModal.tsx';
import PlacesTopControls, { type PlacesTopControlsHandle } from './PlacesTopControls.tsx';
import { buildPlaceSections, type PlaceSortOrder } from './lib/placeSections.ts';
import { usePlaceSuggestions } from '@/hooks/places';
import { useCinematicEntrance } from '@/hooks/useCinematicEntrance';
import {
  type BentoStatTileConfig,
  type BentoSortChipConfig,
  type SortOrder,
} from '@/components/ui/BentoWorkspaceController';
import { useBentoSlot } from '@/app/BentoSlotContext';
import { LIBRARY_PLACES_ANCHOR_ID } from '@/utils/libraryWorkspace';

const PLACE_SECTION_IDS = {
  incoming: 'places-section-incoming',
  queue: 'places-section-queue',
  completed: 'places-section-visited',
};

const PLACE_SORTS: BentoSortChipConfig[] = [
  { value: 'recent', label: '🕐 Recent' },
  { value: 'alpha', label: 'A→Z' },
];

const PlacesMap = React.lazy(() => import("./PlacesMap.tsx"));

interface PlacesListProps {
  hideSearch?: boolean;
}

const PlacesList: React.FC<PlacesListProps> = ({ hideSearch = false }) => {
  const mapRef = useRef<PlacesMapHandle>(null);
  const placesBodyRef = useRef<HTMLDivElement>(null);
  const placesTopControlsRef = useRef<PlacesTopControlsHandle>(null);
  const { currentUser } = useUser();
  const { registerTabConfig } = useBentoSlot();
  const setConfig = useCallback(
    (config: Parameters<typeof registerTabConfig>[1]) =>
      registerTabConfig("places", config),
    [registerTabConfig],
  );
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

  const [sortOrder, setSortOrder] = useState<PlaceSortOrder>('recent');
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<
    string | null
  >(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const [placeToEdit, setPlaceToEdit] = useState<Place | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sections = useMemo(
    () => buildPlaceSections(places, pendingSuggestions, sortOrder),
    [places, pendingSuggestions, sortOrder],
  );

  const placeStats = useMemo((): BentoStatTileConfig[] => [
    {
      id: 'incoming',
      label: 'Incoming',
      count: pendingSuggestions.length,
      icon: <MessageIcon size={14} />,
      sectionId: PLACE_SECTION_IDS.incoming,
      tone: 'incoming',
    },
    {
      id: 'queue',
      label: 'To Try',
      count: sections.queue.length,
      icon: <MapPinIcon size={14} />,
      sectionId: PLACE_SECTION_IDS.queue,
      tone: 'default',
    },
    {
      id: 'visited',
      label: 'Visited',
      count: sections.completed.length,
      icon: <CheckIcon size={14} />,
      sectionId: PLACE_SECTION_IDS.completed,
      tone: 'completed',
    },
  ], [pendingSuggestions.length, sections.queue.length, sections.completed.length]);
  const pinnedCount = useMemo(
    () =>
      places.filter(
        (place) =>
          typeof place.lat === "number" && typeof place.lng === "number",
      ).length,
    [places],
  );

  const allPlaces = useMemo(
    () => [...sections.queue, ...sections.completed],
    [sections.queue, sections.completed],
  );

  const handlePlaceSortChange = useCallback((order: SortOrder) => {
    setSortOrder(order as PlaceSortOrder);
  }, []);

  useEffect(() => {
    setConfig({
      stats: placeStats,
      sorts: PLACE_SORTS,
      activeSortOrder: sortOrder,
      onSortChange: handlePlaceSortChange,
      ariaLabel: 'Places workspace controls',
    });
  }, [setConfig, placeStats, sortOrder, handlePlaceSortChange]);

  const handleCardTap = useCallback((place: Place) => {
    if (typeof place.lat === "number" && typeof place.lng === "number") {
      mapRef.current?.flyTo(place.lng, place.lat);
    }
    clearTimeout(activeTimerRef.current);
    setActiveCardId(place.id);
    activeTimerRef.current = setTimeout(() => setActiveCardId(null), 2500);
  }, []);

  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, place: Place) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCardTap(place);
      }
    },
    [handleCardTap],
  );

  useEffect(() => () => clearTimeout(activeTimerRef.current), []);

  const focusPlacesSearch = useCallback(() => {
    placesTopControlsRef.current?.focusSearchInput();
  }, []);

  useEffect(() => {
    if (hideSearch) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        focusPlacesSearch();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusPlacesSearch, hideSearch]);

  const handleAcceptSuggestion = useCallback(
    async (suggestion: PlaceSuggestion) => {
      if (!currentUser) return;
      setProcessingSuggestionId(suggestion.id);
      try {
        await addPlace(suggestion.name, suggestion.notes);
        await acceptPlaceSuggestion(suggestion.id, currentUser);
        showToast({
          message: `"${suggestion.name}" added to places!`,
          type: "success",
        });
      } catch (error) {
        showToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to accept suggestion",
          type: "error",
        });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [acceptPlaceSuggestion, addPlace, currentUser, showToast],
  );

  const handleRejectSuggestion = useCallback(
    async (suggestionId: string, name: string) => {
      if (!currentUser) return;
      setProcessingSuggestionId(suggestionId);
      try {
        await rejectPlaceSuggestion(suggestionId, currentUser);
        showToast({ message: `"${name}" rejected.`, type: "info" });
      } catch (error) {
        showToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to reject suggestion",
          type: "error",
        });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [currentUser, rejectPlaceSuggestion, showToast],
  );

  const handleAddAction = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || isAdding) return;
    if (!currentUser) {
      showToast({
        message: "Pick Aaron or Electra to edit shared places.",
        type: "info",
      });
      return;
    }
    setIsAdding(true);
    setSuggestionError(null);
    try {
      await addPlace(query);
      setSearchQuery("");
      showToast({ message: `"${query}" added!`, type: "success" });
    } catch (error) {
      setSuggestionError(
        error instanceof Error ? error.message : "Failed to add place",
      );
      showToast({ message: "Failed to add place", type: "error" });
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
      setSearchQuery("");
      showToast({
        message: `"${query}" suggested for review!`,
        type: "success",
      });
    } catch (error) {
      setSuggestionError(
        error instanceof Error ? error.message : "Failed to suggest place",
      );
      showToast({ message: "Failed to suggest place", type: "error" });
    } finally {
      setIsSuggesting(false);
    }
  }, [addPlaceSuggestion, isSuggesting, searchQuery, showToast]);

  const confirmDelete = useCallback(async () => {
    if (!placeToDelete) return;
    const deleted = placeToDelete;
    try {
      await removePlace(deleted.id);
      showToast({ message: `"${deleted.name}" removed!`, type: "info" });
    } catch {
      showToast({ message: "Failed to remove place", type: "error" });
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
                cursor: "pointer",
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
            <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>🗺️</span>
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
    ],
  );

  const hasPlaces = allPlaces.length > 0;
  const showEmptyState = !isLoading && !hasPlaces;

  const placeCardsReady =
    !isLoading && (hasPlaces || pendingSuggestions.length > 0);
  useCinematicEntrance(placesBodyRef, placeCardsReady, ".card-tilt-wrap");

  useEffect(() => {
    if (window.location.hash.replace(/^#/, "") !== "places") {
      return;
    }
    placesBodyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section id={LIBRARY_PLACES_ANCHOR_ID} className="library-places" aria-label="Places">
      <h2 className="workspace-section-heading library-places-heading">
        <span className="workspace-section-heading__content">
          <span className="workspace-section-heading__label">Places</span>
        </span>
      </h2>
      {hideSearch ? null : (
      <div className="places-search-container">
        <PlacesTopControls
          ref={placesTopControlsRef}
          queueCount={sections.queue.length}
          visitedCount={sections.completed.length}
          pinnedCount={pinnedCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          suggestionAutocompleteResults={pendingSuggestions}
          onSubmit={handleAddAction}
          onSuggest={handleSuggestAction}
          isAdding={isAdding}
          isSuggesting={isSuggesting}
          suggestionError={suggestionError}
          canEdit={Boolean(currentUser)}
        />
      </div>
      )}
      <div
        ref={placesBodyRef}
        className="watchlist-container places-container"
      >
      {isDegraded && (
        <SyncBanner
          isBlocked={isSyncBlocked}
          onRetry={() => void retrySync()}
          label={
            isSyncBlocked
              ? "A shared places change conflicted with local edits. Refresh and retry."
              : syncWarning ||
                "Places changes are being kept locally until shared sync recovers."
          }
        />
      )}
      {isSuggestionsDegraded && (
        <SyncBanner
          isBlocked={isSuggestionsSyncBlocked}
          onRetry={() => void retrySuggestionsSync()}
          label={
            suggestionsSyncWarning ||
            "Place suggestion changes are being kept locally."
          }
        />
      )}

      {isLoading && allPlaces.length === 0 && (
        <CollectionGrid
          className="watchlist-content places-grid"
          minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
        >
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <CollectionEmptyState
              padding="1.5rem"
              className="collection-empty-state--tight"
            >
              <span
                style={{ fontSize: "1.75rem", lineHeight: 1, opacity: 0.7 }}
                aria-hidden="true"
              >
                🗺️
              </span>
              <strong>Loading your places</strong>
            </CollectionEmptyState>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "inherit",
                gap: "inherit",
              }}
            >
              {["p1", "p2", "p3", "p4"].map((key) => (
                <MovieCardSkeleton key={key} />
              ))}
            </div>
          </div>
        </CollectionGrid>
      )}

      {allPlaces.length > 0 && (
        <React.Suspense fallback={<div className="places-map-placeholder" />}>
          <PlacesMap
            ref={mapRef}
            places={allPlaces}
            canEdit={Boolean(currentUser)}
            onUpdatePlace={async (id, updates) => {
              await updatePlace(id, updates);
            }}
          />
        </React.Suspense>
      )}

      {pendingSuggestions.length > 0 && (
        <CollectionSection heading="Incoming" tone="incoming" id={PLACE_SECTION_IDS.incoming}>
          <CollectionGrid
            className="watchlist-content places-grid"
            minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
          >
            {pendingSuggestions.map((suggestion) => (
              <PlaceSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => void handleAcceptSuggestion(suggestion)}
                onReject={() =>
                  void handleRejectSuggestion(suggestion.id, suggestion.name)
                }
                canRespond={Boolean(currentUser)}
                disableActions={!currentUser}
                isProcessing={processingSuggestionId === suggestion.id}
              />
            ))}
          </CollectionGrid>
        </CollectionSection>
      )}

      {sections.queue.length > 0 && (
        <CollectionSection heading="To Try" id={PLACE_SECTION_IDS.queue}>
          {renderPlaceGrid(
            sections.queue,
            "Search above to add your first spot",
          )}
        </CollectionSection>
      )}

      {sections.completed.length > 0 && (
        <CollectionSection heading="Visited" tone="completed" id={PLACE_SECTION_IDS.completed}>
          {renderPlaceGrid(sections.completed, "No visited places yet")}
        </CollectionSection>
      )}

      {showEmptyState && (
        <CollectionGrid
          className="watchlist-content places-grid"
          minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
        >
          <CollectionEmptyState className="places-empty-state">
            <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>🗺️</span>
            <strong className="places-empty-state__title">No places yet</strong>
            <span className="places-empty-state__hint">
              Add a restaurant, café, park, or anywhere else you&apos;d like to visit together.
            </span>
          </CollectionEmptyState>
        </CollectionGrid>
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
          onSave={async (id, updates) => {
            await updatePlace(id, updates);
          }}
          onClose={() => setPlaceToEdit(null)}
        />
      )}
      </div>
    </section>
  );
};

export default memo(PlacesList);
