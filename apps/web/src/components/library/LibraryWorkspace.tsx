import React, { memo, useState } from "react";
import type { Place } from "@/shared/types";
import { useUser } from "@/app/providerContexts";
import { usePlaces } from "@/hooks/places";
import { ConfirmDialog, SyncBanner } from "@/components/ui";
import { PlaceCard } from "@/components/places";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
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

const LibraryWorkspace: React.FC = () => {
  return (
    <div className="library-workspace library-workspace--ambient">
      <LibrarySearch />
      <React.Suspense fallback={null}>
        <UnifiedLibrary isInteractionStatic={false} />
      </React.Suspense>
    </div>
  );
};

export default memo(LibraryWorkspace);
