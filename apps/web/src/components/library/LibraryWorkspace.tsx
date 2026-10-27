import React, { memo } from "react";
import type { MainTab } from "@/shared/types";
import { MoviesView } from "@/components/movies";

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
    <div className="library-workspace has-search">
      <React.Suspense fallback={null}>
        <UnifiedLibrary isInteractionStatic={false} />
      </React.Suspense>
    </div>
  );
};

export default memo(LibraryWorkspace);
