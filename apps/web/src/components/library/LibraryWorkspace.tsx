import React, { memo } from "react";
import type { MainTab } from "@/shared/types";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
const MoviesView = lazyWithRetry(() =>
  import("@/components/movies").then((m) => ({ default: m.MoviesView })),
);
const PlacesList = lazyWithRetry(() =>
  import("@/components/places").then((m) => ({ default: m.PlacesList })),
);
import LibrarySearch from "./LibrarySearch";

interface UnifiedLibraryProps {
  isInteractionStatic: boolean;
}

const UnifiedLibrary: React.FC<UnifiedLibraryProps> = ({
  isInteractionStatic,
}) => {
  return <MoviesView isInteractionStatic={isInteractionStatic} />;
};

interface LibraryWorkspaceProps {
  activeTab?: MainTab;
}

const LibraryWorkspace: React.FC<LibraryWorkspaceProps> = ({
  activeTab = "movies",
}) => {
  return (
    <div className="library-workspace library-workspace--ambient">
      <LibrarySearch />
      <React.Suspense fallback={null}>
        {activeTab === "places" ? (
          <PlacesList />
        ) : (
          <UnifiedLibrary isInteractionStatic={false} />
        )}
      </React.Suspense>
    </div>
  );
};

export default memo(LibraryWorkspace);
