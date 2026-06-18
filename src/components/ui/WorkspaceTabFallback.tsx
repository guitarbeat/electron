import type { FC } from "react";
import type { MainTab } from "@/shared/types";
import WorkspaceTabLoading from "@/components/ui/WorkspaceTabLoading";
import {
  WORKSPACE_LOADING_COPY,
  WORKSPACE_TAB_CONTAINER,
} from "@/utils/workspaceConfig";

interface WorkspaceTabFallbackProps {
  tab: MainTab;
}

const WorkspaceTabFallback: FC<WorkspaceTabFallbackProps> = ({ tab }) => {
  const { emoji, label } = WORKSPACE_LOADING_COPY[tab];
  const ariaLabel = tab === "movies" ? "Loading movies" : "Loading places";

  return (
    <div className={WORKSPACE_TAB_CONTAINER[tab]} aria-label={ariaLabel}>
      <WorkspaceTabLoading emoji={emoji} label={label} />
    </div>
  );
};

export default WorkspaceTabFallback;
