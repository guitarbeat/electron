import type { FC } from "react";
import type { MainTab } from "@/shared/types";
import WorkspaceTabLoading from "./WorkspaceTabLoading";
import {
  WORKSPACE_LOADING_COPY,
  WORKSPACE_TAB_CONTAINER,
} from "@/utils/workspaceConfig";

export interface WorkspaceTabFallbackProps {
  tab: MainTab;
}

const WorkspaceTabFallback: FC<WorkspaceTabFallbackProps> = ({ tab }) => {
  const { emoji, label } = WORKSPACE_LOADING_COPY[tab];
  return (
    <div className={WORKSPACE_TAB_CONTAINER[tab]} aria-label={`Loading ${tab}`}>
      <WorkspaceTabLoading emoji={emoji} label={label} />
    </div>
  );
};

export default WorkspaceTabFallback;
