import type { FC } from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import { MovieCardSkeleton } from "@/ui/Skeleton";
import WorkspaceTabLoading from "@/components/ui/WorkspaceTabLoading";
import { useViewport } from "@/app/ViewportContext";
import type { MainTab } from "@/shared/types";
import {
  MOVIES_POSTER_GRID_MIN_COL,
  PLACES_GRID_CLASS,
  PLACES_GRID_MIN_COL,
  WORKSPACE_LOADING_COPY,
  WORKSPACE_SKELETON_KEYS,
} from "@/utils/workspaceConfig";

interface WorkspaceCollectionLoadingProps {
  tab: MainTab;
  gridClassName?: string;
  minColumnWidth?: string;
  browseLayoutClass?: string;
}

const WorkspaceCollectionLoading: FC<WorkspaceCollectionLoadingProps> = ({
  tab,
  gridClassName,
  minColumnWidth,
  browseLayoutClass = "",
}) => {
  const { isMobile } = useViewport();
  const { emoji, label } = WORKSPACE_LOADING_COPY[tab];
  const skeletonKeys = isMobile
    ? WORKSPACE_SKELETON_KEYS[tab].mobile
    : WORKSPACE_SKELETON_KEYS[tab].desktop;

  const resolvedClassName =
    gridClassName ??
    (tab === "places"
      ? PLACES_GRID_CLASS
      : `watchlist-content${browseLayoutClass}`);
  const resolvedMinCol =
    minColumnWidth ??
    (tab === "places" ? PLACES_GRID_MIN_COL : MOVIES_POSTER_GRID_MIN_COL);

  return (
    <ChromaCollectionGrid
      className={resolvedClassName}
      minColumnWidth={resolvedMinCol}
    >
      <div className="workspace-loading-grid" aria-busy="true">
        <WorkspaceTabLoading emoji={emoji} label={label} />
        <div className="workspace-loading-grid__cards" aria-hidden="true">
          {skeletonKeys.map((key) => (
            <MovieCardSkeleton key={key} />
          ))}
        </div>
      </div>
    </ChromaCollectionGrid>
  );
};

export default WorkspaceCollectionLoading;
