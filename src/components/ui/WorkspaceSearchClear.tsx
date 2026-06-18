import type { FC } from "react";

interface WorkspaceSearchClearProps {
  onClick: () => void;
  label?: string;
}

const WorkspaceSearchClear: FC<WorkspaceSearchClearProps> = ({
  onClick,
  label = "Clear search",
}) => (
  <button
    type="button"
    className="watchlist-top-controls__search-clear"
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    <span aria-hidden="true">×</span>
  </button>
);

export default WorkspaceSearchClear;
