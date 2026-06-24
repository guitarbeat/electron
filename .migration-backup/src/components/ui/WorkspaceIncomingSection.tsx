import type { FC, ReactNode } from "react";
import { CollectionSection } from "@/ui/CollectionLayout";

export interface WorkspaceIncomingSectionProps {
  heading: ReactNode;
  sectionId: string;
  isLoading: boolean;
  itemCount: number;
  /** When omitted, shows the count pill whenever `itemCount` is set and heading is visible. */
  showCount?: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

/**
 * Shared incoming-suggestions shell for movies and places workspaces.
 * Handles loading skeleton vs content, section heading, and scroll target id.
 */
const WorkspaceIncomingSection: FC<WorkspaceIncomingSectionProps> = ({
  heading,
  sectionId,
  isLoading,
  itemCount,
  showCount,
  skeleton,
  children,
}) => {
  if (!isLoading && itemCount === 0) {
    return null;
  }

  return (
    <CollectionSection
      heading={heading}
      count={isLoading && itemCount === 0 ? undefined : itemCount}
      showCount={showCount}
      tone="incoming"
      id={sectionId}
    >
      {isLoading && itemCount === 0 ? skeleton : children}
    </CollectionSection>
  );
};

export default WorkspaceIncomingSection;
