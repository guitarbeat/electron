import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser, useToast } from "@/app/useProviders";
import { usePlaces } from "@/hooks/places";
import ConfirmDialog from "@/ui/ConfirmDialog";
import {
  CollectionSection,
} from "@/ui/CollectionLayout";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import PlacesLoadingGrid from "./PlacesLoadingGrid.tsx";
import SyncBanner from "../ui/SyncBanner.tsx";
import type { Place, PlaceSuggestion } from "../../shared/types.ts";
import type { PlacesMapHandle } from "./PlacesMap.tsx";
import PlaceSuggestionCard from "./PlaceSuggestionCard.tsx";
import PlaceEditModal from "./PlaceEditModal.tsx";
import PlacesTopControls, {
  type PlacesTopControlsHandle,
} from "./PlacesTopControls.tsx";
import PlacesGrid from "./PlacesGrid.tsx";
import PlacesEmptyState from "./PlacesEmptyState.tsx";
import {
  buildPlaceSections,
  type PlaceSortOrder,
} from "./lib/placeSections.ts";
import { usePlaceSuggestions } from "@/hooks/places";
import { useCinematicEntrance } from "@/hooks/useCinematicEntrance";
import { getErrorMessage } from "@/utils";
import { createPortal } from "react-dom";
import { useBentoSlot } from "@/app/BentoSlotContext";
import {
  type BentoSortChipConfig,
  type SortOrder,
} from "@/components/ui/BentoWorkspaceController";
import { useFocusSearchShortcut } from "@/hooks/useFocusSearchShortcut";
import { useWorkspaceBentoConfig } from "@/hooks/useWorkspaceBentoConfig";
import { mediaBreakpoints, useMediaQuery } from "@/hooks/useMediaQuery";
import { workspaceSectionLabels } from "@/utils/workspaceSectionLabels";

const PLACE_SECTION_IDS = {
  incoming: "places-section-incoming",
  queue: "places-section-queue",
  completed: "places-section-visited",
};

const PLACE_SORTS: BentoSortChipConfig[] = [
  { value: "recent", label: "🕐 Recent", ariaLabel: "Recent" },
  { value: "alpha", label: "A→Z", ariaLabel: "Alphabetical" },
];

const MOBILE_PLACE_SORTS: BentoSortChipConfig[] = [
  { value: "recent", label: "🕐", ariaLabel: "Recent" },
  { value: "alpha", label: "A→Z", ariaLabel: "Alphabetical" },
];

const PlacesMap = React.lazy(() => import("./PlacesMap.tsx"));

const PlacesList: React.FC = () => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const mapRef = useRef<PlacesMapHandle>(null);
  const placesBodyRef = useRef<HTMLDivElement>(null);
  const placesTopControlsRef = useRef<PlacesTopControlsHandle>(null);
  const { currentUser } = useUser();
  const { searchPortalEl } = useBentoSlot();
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

  const [sortOrder, setSortOrder] = useState<PlaceSortOrder>("recent");
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

  const handlePlaceSortChange = useCallback((order: SortOrder) => {
    setSortOrder(order as PlaceSortOrder);
  }, []);

  useWorkspaceBentoConfig({
    tab: "places",
    isMobile,
    sectionIds: PLACE_SECTION_IDS,
    counts: {
      incoming: pendingSuggestions.length,
      queue: sections.queue.length,
      completed: sections.completed.length,
    },
    sortOrder,
    onSortChange: handlePlaceSortChange,
    sorts: PLACE_SORTS,
    mobileSorts: MOBILE_PLACE_SORTS,
    ariaLabel: "Places workspace controls",
  });

  const handleCardTap = useCallback((place: Place) => {
    if (typeof place.lat === "number" && typeof place.lng === "number") {
      mapRef.current?.flyTo(place.lng, place.lat);
    }
    clearTimeout(activeTimerRef.current);
    setActiveCardId(place.id);
    activeTimerRef.current = setTimeout(() => setActiveCardId(null), 2500);
  }, []);

  useEffect(() => () => clearTimeout(activeTimerRef.current), []);

  const focusPlacesSearch = useCallback(() => {
    placesTopControlsRef.current?.focusSearchInput();
  }, []);

  useFocusSearchShortcut(focusPlacesSearch);

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
      const message = getErrorMessage(error, "Failed to add place");
      setSuggestionError(message);
      showToast({ message, type: "error" });
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
      const message = getErrorMessage(error, "Failed to suggest place");
      setSuggestionError(message);
      showToast({ message, type: "error" });
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

  const placesSyncDegraded = isDegraded || isSuggestionsDegraded;
  const placesSyncBlocked = isSyncBlocked || isSuggestionsSyncBlocked;
  const placesSyncLabel = useMemo(() => {
    if (isSyncBlocked && isSuggestionsSyncBlocked) {
      return "Shared places and suggestions conflicted with local edits. Refresh and retry.";
    }
    if (isSyncBlocked) {
      return "A shared places change conflicted with local edits. Refresh and retry.";
    }
    if (isSuggestionsSyncBlocked) {
      return (
        suggestionsSyncWarning ||
        "Place suggestion changes conflicted with local edits. Refresh and retry."
      );
    }
    if (isDegraded && isSuggestionsDegraded) {
      return (
        syncWarning ||
        "Places and suggestions are being kept locally until shared sync recovers."
      );
    }
    if (isDegraded) {
      return (
        syncWarning ||
        "Places changes are being kept locally until shared sync recovers."
      );
    }
    return (
      suggestionsSyncWarning ||
      "Place suggestion changes are being kept locally."
    );
  }, [
    isDegraded,
    isSuggestionsDegraded,
    isSyncBlocked,
    isSuggestionsSyncBlocked,
    syncWarning,
    suggestionsSyncWarning,
  ]);

  const retryPlacesSync = useCallback(() => {
    if (isDegraded) {
      void retrySync();
    }
    if (isSuggestionsDegraded) {
      void retrySuggestionsSync();
    }
  }, [isDegraded, isSuggestionsDegraded, retrySync, retrySuggestionsSync]);

  const allPlaces = useMemo(
    () => [...sections.queue, ...sections.completed],
    [sections.queue, sections.completed],
  );

  const sectionLabels = useMemo(
    () => workspaceSectionLabels("places", isMobile),
    [isMobile],
  );

  const hasPlaces = allPlaces.length > 0;
  const showEmptyState = !isLoading && !hasPlaces;

  const placeCardsReady =
    !isLoading && (hasPlaces || pendingSuggestions.length > 0);
  useCinematicEntrance(placesBodyRef, placeCardsReady, ".card-tilt-wrap");

  return (
    <>
      {searchPortalEl &&
        createPortal(
          <PlacesTopControls
            ref={placesTopControlsRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            suggestionAutocompleteResults={pendingSuggestions}
            onSubmit={handleAddAction}
            onSuggest={handleSuggestAction}
            isAdding={isAdding}
            isSuggesting={isSuggesting}
            suggestionError={suggestionError}
            canEdit={Boolean(currentUser)}
          />,
          searchPortalEl,
        )}
      <div ref={placesBodyRef} className="watchlist-container places-container">
        {placesSyncDegraded && (
          <SyncBanner
            isBlocked={placesSyncBlocked}
            onRetry={() => void retryPlacesSync()}
            label={placesSyncLabel}
          />
        )}

        {isLoading && allPlaces.length === 0 ? <PlacesLoadingGrid /> : null}

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
          <CollectionSection
            heading={sectionLabels.incoming}
            tone="incoming"
            id={PLACE_SECTION_IDS.incoming}
          >
            <ChromaCollectionGrid
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
            </ChromaCollectionGrid>
          </CollectionSection>
        )}

        {sections.queue.length > 0 && (
          <CollectionSection heading={sectionLabels.queue} id={PLACE_SECTION_IDS.queue}>
            <PlacesGrid
              places={sections.queue}
              emptyStateHint="Search above to add your first spot"
              canEdit={Boolean(currentUser)}
              isSubmitting={isSubmitting}
              activeCardId={activeCardId}
              onCardTap={handleCardTap}
              onMarkVisited={markVisited}
              onMarkUnvisited={markUnvisited}
              onDelete={setPlaceToDelete}
              onEdit={setPlaceToEdit}
            />
          </CollectionSection>
        )}

        {sections.completed.length > 0 && (
          <CollectionSection
            heading={sectionLabels.completed}
            tone="completed"
            id={PLACE_SECTION_IDS.completed}
          >
            <PlacesGrid
              places={sections.completed}
              emptyStateHint="No visited places yet"
              canEdit={Boolean(currentUser)}
              isSubmitting={isSubmitting}
              activeCardId={activeCardId}
              onCardTap={handleCardTap}
              onMarkVisited={markVisited}
              onMarkUnvisited={markUnvisited}
              onDelete={setPlaceToDelete}
              onEdit={setPlaceToEdit}
            />
          </CollectionSection>
        )}

        {showEmptyState && (
          <ChromaCollectionGrid
            className="watchlist-content places-grid"
            minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
          >
            <PlacesEmptyState hint="Add a restaurant, café, park, or anywhere else you'd like to visit together." />
          </ChromaCollectionGrid>
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
    </>
  );
};

export default memo(PlacesList);
