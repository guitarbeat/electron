import type { FC } from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import type { MainTab } from "@/shared/types";
import { WorkspaceGlobalEmpty } from "@/components/ui/WorkspaceEmptyState";

export interface WorkspaceCollectionGlobalEmptyProps {
  tab: MainTab;
  className: string;
  minColumnWidth: string;
  onAction?: () => void;
  actionLabel?: string;
  actionBusy?: boolean;
}

/** Global empty state centered inside a chroma collection grid shell. */
const WorkspaceCollectionGlobalEmpty: FC<
  WorkspaceCollectionGlobalEmptyProps
> = ({
  tab,
  className,
  minColumnWidth,
  onAction,
  actionLabel,
  actionBusy,
}) => (
  <ChromaCollectionGrid className={className} minColumnWidth={minColumnWidth}>
    <WorkspaceGlobalEmpty
      tab={tab}
      onAction={onAction}
      actionLabel={actionLabel}
      actionBusy={actionBusy}
    />
  </ChromaCollectionGrid>
);

export default WorkspaceCollectionGlobalEmpty;
