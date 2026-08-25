import React, { memo, useEffect, useState } from "react";
import type { Place } from "@/shared/types";
import { useUser } from "@/app/providerContexts";
import { usePlaces } from "@/hooks/places";
import { ConfirmDialog, SyncBanner } from "@/components/ui";
import { PlaceCard } from "@/components/places";
import { lazyWithRetry } from "@/app/lazyFeaturePanels";
const MoviesView = lazyWithRetry(() => import("@/components/movies").then(m => ({ default: m.MoviesView })));
import LibrarySearch from "./LibrarySearch";

interface UnifiedLibraryProps {
  isInteractionStatic: boolean;
}

const UnifiedLibrary: React.FC<UnifiedLibraryProps> = ({
  isInteractionStatic,
}) => {
  const { currentUser } = useUser();
  const {
    places,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    retrySync,
    removePlace,
    markVisited,
    markUnvisited,
  } = usePlaces(currentUser);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);

  const placeCards = places.map((place) => (
    <PlaceCard
      key={`place-${place.id}`}
      place={place}
      canEdit={Boolean(currentUser)}
      onMarkVisited={markVisited}
      onMarkUnvisited={markUnvisited}
      onDelete={setPlaceToDelete}
    />
  ));

  return (
    <>
      {isDegraded ? (
        <SyncBanner
          isBlocked={isSyncBlocked}
          onRetry={() => void retrySync()}
          label={
            syncWarning ||
            "Place changes are being kept locally until shared sync recovers."
          }
        />
      ) : null}
      <MoviesView
        isInteractionStatic={isInteractionStatic}
        posterPlaceCards={placeCards}
      />
      {placeToDelete ? (
        <ConfirmDialog
          isOpen
          title="Remove place"
          message={`Are you sure you want to remove "${placeToDelete.name}" from your list?`}
          onConfirm={() => {
            removePlace(placeToDelete.id);
            setPlaceToDelete(null);
          }}
          onCancel={() => setPlaceToDelete(null)}
          confirmText="Remove"
          variant="danger"
        />
      ) : null}
    </>
  );
};

const IDLE_TIMEOUT_MS = 2500;

const LibraryWorkspace: React.FC = () => {
  const [isInteractionStatic, setIsInteractionStatic] = useState(false);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastActivityTime = 0;

    const scheduleResume = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }

      idleTimer = setTimeout(() => {
        const isInputFocused =
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA" ||
          document.activeElement?.getAttribute("contenteditable") === "true";

        const isModalOpen = Boolean(
          document.querySelector(
            '[role="dialog"], .modal-backdrop, .movie-details-modal, .game-overlay',
          ),
        );

        if (!isInputFocused && !isModalOpen) {
          setIsInteractionStatic(false);
        } else {
          // If modal/input was focused, check again shortly
          scheduleResume();
        }
      }, IDLE_TIMEOUT_MS);
    };

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle event handling to max once per 150ms to prevent RAF loop stutters
      if (now - lastActivityTime < 150) return;
      lastActivityTime = now;

      setIsInteractionStatic((prev) => (prev ? prev : true));
      scheduleResume();
    };

    // Begin in ambient moving mode; if user touches or moves, freeze and schedule resume
    scheduleResume();

    window.addEventListener("pointermove", handleUserActivity, { passive: true });
    window.addEventListener("pointerdown", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });
    window.addEventListener("wheel", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });

    return () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      window.removeEventListener("pointermove", handleUserActivity);
      window.removeEventListener("pointerdown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("wheel", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, []);

  return (
    <div
      className={`library-workspace ${isInteractionStatic ? "library-workspace--static" : "library-workspace--ambient"}`}
    >
      <LibrarySearch />
      <React.Suspense fallback={null}>
        <UnifiedLibrary
          isInteractionStatic={isInteractionStatic}
        />
      </React.Suspense>
    </div>
  );
};

export default memo(LibraryWorkspace);
