import type { FC } from "react";
import type { MainTab } from "@/shared/types";
import WorkspaceTabLoading from "@/components/ui/WorkspaceTabLoading";

const TAB_FALLBACK = {
  movies: {
    emoji: "🍿",
    label: "Loading movies…",
    className: "watchlist-container",
    ariaLabel: "Loading movies",
  },
  places: {
    emoji: "🗺️",
    label: "Loading places…",
    className: "watchlist-container places-container",
    ariaLabel: "Loading places",
  },
} as const satisfies Record<
  MainTab,
  { emoji: string; label: string; className: string; ariaLabel: string }
>;

interface WorkspaceTabFallbackProps {
  tab: MainTab;
}

const WorkspaceTabFallback: FC<WorkspaceTabFallbackProps> = ({ tab }) => {
  const { emoji, label, className, ariaLabel } = TAB_FALLBACK[tab];

  return (
    <div className={className} aria-label={ariaLabel}>
      <WorkspaceTabLoading emoji={emoji} label={label} />
    </div>
  );
};

export default WorkspaceTabFallback;
