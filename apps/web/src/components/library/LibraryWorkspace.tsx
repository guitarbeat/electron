import React, { memo, useEffect, useState } from "react";
import type { Place } from "@/shared/types";
import { useUser } from "@/app/providerContexts";
import { usePlaces } from "@/hooks/places";
import { ConfirmDialog, SyncBanner } from "@/components/ui";
import { PlaceCard } from "@/components/places";
const MoviesView = React.lazy(() => import("@/components/movies").then(m => ({ default: m.MoviesView })));
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

const LibraryWorkspace: React.FC = () => {
  const [isInteractionStatic, setIsInteractionStatic] = useState(false);

  useEffect(() => {
    const freezeWall = () => setIsInteractionStatic(true);
    window.addEventListener("pointermove", freezeWall, { passive: true });
    window.addEventListener("pointerdown", freezeWall, { passive: true });
    window.addEventListener("touchstart", freezeWall, { passive: true });
    window.addEventListener("keydown", freezeWall);

    return () => {
      window.removeEventListener("pointermove", freezeWall);
      window.removeEventListener("pointerdown", freezeWall);
      window.removeEventListener("touchstart", freezeWall);
      window.removeEventListener("keydown", freezeWall);
    };
  }, []);

  return (
    <div
      className={`library-workspace ${isInteractionStatic ? "library-workspace--static" : "library-workspace--ambient"}`}
    >
      {isInteractionStatic ? <LibrarySearch /> : null}
      <React.Suspense fallback={null}>
        <UnifiedLibrary
          isInteractionStatic={isInteractionStatic}
        />
      </React.Suspense>
    </div>
  );
};

export default memo(LibraryWorkspace);
