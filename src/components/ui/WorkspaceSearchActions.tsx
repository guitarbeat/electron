import type { FC, ReactNode } from "react";

interface WorkspaceSearchActionsProps {
  children: ReactNode;
}

const WorkspaceSearchActions: FC<WorkspaceSearchActionsProps> = ({ children }) => (
  <div className="watchlist-top-controls__search-actions">{children}</div>
);

export default WorkspaceSearchActions;
