import React, { memo } from "react";
const MoviesView = React.lazy(() => import("@/components/movies").then(m => ({ default: m.MoviesView })));
const PlacesList = React.lazy(() => import("@/components/places").then(m => ({ default: m.PlacesList })));
import LibrarySearch from "./LibrarySearch";

const LibraryWorkspace: React.FC = () => (
  <div className="library-workspace">
    <LibrarySearch />
    <React.Suspense fallback={null}>
      <MoviesView  />
      <PlacesList  />
    </React.Suspense>
  </div>
);

export default memo(LibraryWorkspace);
