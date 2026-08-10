import type { FC, ReactNode } from "react";
import { Spinner } from "@/common/Icons";

interface WorkspaceTabLoadingProps {
  label: string;
  emoji?: ReactNode;
  children?: ReactNode;
}

const WorkspaceTabLoading: FC<WorkspaceTabLoadingProps> = ({
  label,
  emoji,
  children,
}) => (
  <div className="workspace-tab-loading" role="status" aria-live="polite">
    <span className="workspace-tab-loading__emoji" aria-hidden="true">
      {emoji ?? <Spinner size={18} />}
    </span>
    <span className="workspace-tab-loading__label">{label}</span>
    {children}
  </div>
);

export default WorkspaceTabLoading;
