import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser, useToast } from "@/app/useProviders";
import { usePlaces, usePlaceSuggestions } from "@/hooks/places";
import ConfirmDialog from "@/ui/ConfirmDialog";
import SyncBanner from "@/components/ui/SyncBanner";
import type { Place, PlaceSuggestion } from "@/shared/types";
import type { PlacesMapHandle } from "./PlacesMap.tsx";
import PlaceEditModal from "./PlaceEditModal.tsx";
import PlacesTopControls, {
  type PlacesTopControlsHandle,
} from "./PlacesTopControls.tsx";
import PlacesSectionBody from "./PlacesSectionBody.tsx";
import { buildPlaceSections } from "./lib/placeSections.ts";
import { useCinematicEntrance } from "@/hooks/useCinematicEntrance";
import { getErrorMessage } from "@/utils";
import { createPortal } from "react-dom";
import { useBentoSlot } from "@/app/BentoSlotContext";
import { useWorkspaceBentoConfig } from "@/hooks/useWorkspaceBentoConfig";
import { useWorkspaceSyncBanner } from "@/hooks/useWorkspaceSyncBanner";

const PlacesMap = React.lazy(() => import("./PlacesMap.tsx"));

const PlacesList: React.FC = () => {
  useEffect(() => {
    void import("@/app/skins/places-skin.scss");
  }, []);

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
    isLoading: isSuggestionsLoading,
    isDegraded: isSuggestionsDegraded,
    isSyncBlocked: isSuggestionsSyncBlocked,
    syncWarning: suggestionsSyncWarning,
    retrySync: retrySuggestionsSync,
  } = usePlaceSuggestions(isLoading);

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
    () => buildPlaceSections(places, pendingSuggestions),
    [places, pendingSuggestions],
  );

  useWorkspaceBentoConfig({
    tab: "places",
    ariaLabel: "Places workspace controls",
  });

  const syncBanner = useWorkspaceSyncBanner({
    sources: [
      {
        isDegraded,
        isSyncBlocked,
        syncWarning,
        retrySync,
      },
      {
        isDegraded: isSuggestionsDegraded,
        isSyncBlocked: isSuggestionsSyncBlocked,
        syncWarning: suggestionsSyncWarning,
        retrySync: retrySuggestionsSync,
      },
    ],
    combinedBlockedLabel:
      "Shared places and suggestions conflicted with local edits. Refresh and retry.",
    combinedDegradedLabel:
      "Places and suggestions are being kept locally until shared sync recovers.",
    blockedLabels: [
      "A shared places change conflicted with local edits. Refresh and retry.",
      suggestionsSyncWarning ||
        "Place suggestion changes conflicted with local edits. Refresh and retry.",
    ],
    degradedLabels: [
      syncWarning ||
        "Places changes are being kept locally until shared sync recovers.",
      suggestionsSyncWarning ||
        "Place suggestion changes are being kept locally.",
    ],
    defaultDegradedLabel:
      suggestionsSyncWarning ||
      "Place suggestion changes are being kept locally.",
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

  const handlePlacesEmptyAction = useCallback(() => {
    const query = searchQuery.trim();
    if (!currentUser && query) {
      void handleSuggestAction();
      return;
    }
    if (currentUser && query) {
      void handleAddAction();
      return;
    }
    focusPlacesSearch();
    if (!currentUser) {
      showToast({
        message: "Type a place name in search, then press Suggest.",
        type: "info",
      });
    }
  }, [
    currentUser,
    focusPlacesSearch,
    handleAddAction,
    handleSuggestAction,
    searchQuery,
    showToast,
  ]);

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

  const allPlaces = useMemo(
    () => [...sections.queue, ...sections.completed],
    [sections.queue, sections.completed],
  );

  const placeCardsReady =
    !isLoading && (allPlaces.length > 0 || pendingSuggestions.length > 0);
  useCinematicEntrance(placesBodyRef, placeCardsReady, ".card-tilt-wrap");

  const mapSlot =
    allPlaces.length > 0 ? (
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
    ) : null;

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
      <div ref={placesBodyRef} className="workspace-container places-container">
        {syncBanner.isDegraded && (
          <SyncBanner
            isBlocked={syncBanner.isBlocked}
            onRetry={() => void syncBanner.onRetry()}
            label={syncBanner.label}
          />
        )}

        <PlacesSectionBody
          sections={sections}
          isLoading={isLoading}
          isSuggestionsLoading={isSuggestionsLoading}
          pendingSuggestions={pendingSuggestions}
          currentUser={currentUser}
          processingSuggestionId={processingSuggestionId}
          onAcceptSuggestion={(suggestion) =>
            void handleAcceptSuggestion(suggestion)
          }
          onRejectSuggestion={(id, name) =>
            void handleRejectSuggestion(id, name)
          }
          canEdit={Boolean(currentUser)}
          isSubmitting={isSubmitting}
          activeCardId={activeCardId}
          onCardTap={handleCardTap}
          onMarkVisited={markVisited}
          onMarkUnvisited={markUnvisited}
          onDelete={setPlaceToDelete}
          onEdit={setPlaceToEdit}
          mapSlot={mapSlot}
          onAddPlaceFocus={handlePlacesEmptyAction}
          emptyActionLabel={
            searchQuery.trim()
              ? currentUser
                ? "Add this place"
                : "Suggest this place"
              : undefined
          }
          emptyActionBusy={isAdding || isSuggesting}
        />

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
