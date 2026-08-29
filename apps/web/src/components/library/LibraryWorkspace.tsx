import React, { memo } from "react";
import type { MainTab } from "@/shared/types";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useUser } from "@/app/providerContexts";
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
  const { currentUser, activeUsers } = useUser();
  const hasLoggedInUser = Boolean(currentUser || (activeUsers && activeUsers.length > 0));

  return (
    <div className={`library-workspace${hasLoggedInUser ? " has-search" : ""}`}>
      {hasLoggedInUser && <LibrarySearch />}
      <React.Suspense fallback={null}>
        <UnifiedLibrary isInteractionStatic={false} />
      </React.Suspense>
    </div>
  );
};

export default memo(LibraryWorkspace);
