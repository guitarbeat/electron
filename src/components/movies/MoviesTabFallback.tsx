import type { FC } from "react";
import WorkspaceTabLoading from "@/components/ui/WorkspaceTabLoading";

const MoviesTabFallback: FC = () => (
  <div className="watchlist-container" aria-label="Loading movies">
    <WorkspaceTabLoading emoji="🍿" label="Loading movies…" />
  </div>
);

export default MoviesTabFallback;
