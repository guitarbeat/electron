import React, { memo } from "react";
import type { MainTab } from "@/shared/types";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
const MoviesView = lazyWithRetry(() =>
  import("@/components/movies").then((m) => ({ default: m.MoviesView })),
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

const LibraryWorkspace: React.FC<LibraryWorkspaceProps> = () => {
  return (
    <div className="library-workspace">
      <LibrarySearch />
      <React.Suspense fallback={null}>
        <UnifiedLibrary isInteractionStatic={false} />
      </React.Suspense>
    </div>
  );
};

export default memo(LibraryWorkspace);
