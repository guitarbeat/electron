import type { FC, ReactNode } from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import Button from "@/ui/Button";
import { CollectionEmptyState } from "@/ui/CollectionLayout";
import { spacing } from "@/theme/tokens";
import { useViewport } from "@/app/ViewportContext";
import type { MainTab } from "@/shared/types";
import {
  WORKSPACE_GLOBAL_EMPTY,
  WORKSPACE_SECTION_EMPTY,
} from "@/utils/workspaceConfig";

type SectionEmptyVariant = "completed" | "queue";

interface WorkspaceSectionEmptyProps {
  tab: MainTab;
  variant: SectionEmptyVariant;
}

export const WorkspaceSectionEmpty: FC<WorkspaceSectionEmptyProps> = ({
  tab,
  variant,
}) => {
  const { isMobile } = useViewport();
  const label =
    variant === "completed"
      ? WORKSPACE_SECTION_EMPTY[tab].completed
      : WORKSPACE_SECTION_EMPTY[tab].queue;

  if (variant === "completed") {
    return (
      <CollectionEmptyState
        padding={isMobile ? spacing.md : spacing["2xl"]}
        className={`watchlist-empty-watched-state${isMobile ? " collection-empty-state--tight" : ""}`}
      >
        <span
          className="watchlist-empty-watched-state__icon"
          aria-hidden="true"
        >
          ✓
        </span>
        <span className="watchlist-empty-watched-state__text">{label}</span>
      </CollectionEmptyState>
    );
  }

  return (
    <CollectionEmptyState
      padding={isMobile ? spacing.md : spacing["2xl"]}
      className={isMobile ? "collection-empty-state--tight" : undefined}
    >
      <span className="watchlist-empty-watched-state__text">{label}</span>
    </CollectionEmptyState>
  );
};

interface WorkspaceGlobalEmptyProps {
  tab: MainTab;
  onAction?: () => void;
  actionLabel?: string;
  actionBusy?: boolean;
  children?: ReactNode;
}

export const WorkspaceGlobalEmpty: FC<WorkspaceGlobalEmptyProps> = ({
  tab,
  onAction,
  actionLabel: actionLabelOverride,
  actionBusy = false,
  children,
}) => {
  const { isMobile } = useViewport();
  const { icon, title, copy, actionLabel: defaultActionLabel } =
    WORKSPACE_GLOBAL_EMPTY[tab];
  const actionLabel = actionLabelOverride ?? defaultActionLabel;

  return (
    <CollectionEmptyState
      padding={isMobile ? spacing.lg : spacing["3xl"]}
      className={`watchlist-empty-queue-state${isMobile ? " collection-empty-state--tight" : ""}`}
    >
      <span className="watchlist-empty-queue-state__icon" aria-hidden="true">
        {icon}
      </span>
      <strong className="watchlist-empty-queue-state__title">{title}</strong>
      <span className="watchlist-empty-queue-state__copy">{copy}</span>
      {children}
      {onAction && actionLabel ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAction}
          isLoading={actionBusy}
          loadingText={actionLabel}
          className="watchlist-empty-queue-state__action"
        >
          {actionLabel}
        </Button>
      ) : null}
    </CollectionEmptyState>
  );
};

export interface WorkspaceCollectionGlobalEmptyProps {
  tab: MainTab;
  className: string;
  minColumnWidth: string;
  onAction?: () => void;
  actionLabel?: string;
  actionBusy?: boolean;
}

export const WorkspaceCollectionGlobalEmpty: FC<
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
