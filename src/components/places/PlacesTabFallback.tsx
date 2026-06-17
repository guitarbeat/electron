import React, { type FC } from "react";
import WorkspaceTabLoading from "@/components/ui/WorkspaceTabLoading";

const PlacesTabFallback: FC = () => (
  <div
    className="watchlist-container places-container"
    aria-label="Loading places"
  >
    <WorkspaceTabLoading emoji="🗺️" label="Loading places…" />
  </div>
);

export default PlacesTabFallback;
