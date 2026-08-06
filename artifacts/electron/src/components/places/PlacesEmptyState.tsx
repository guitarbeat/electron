import { WorkspaceGlobalEmpty } from "@/components/ui/WorkspaceEmptyState";
import React from "react";

const PlacesEmptyState: React.FC<{ title?: string; hint?: string }> = () => (
  <WorkspaceGlobalEmpty tab="places" />
);

export default PlacesEmptyState;
