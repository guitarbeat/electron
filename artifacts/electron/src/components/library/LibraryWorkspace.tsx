import React, { memo } from "react";
import MoviesView from "@/components/movies/MoviesView";
import PlacesList from "@/components/places/PlacesList";
import LibrarySearch from "./LibrarySearch";

const LibraryWorkspace: React.FC = () => (
  <div className="library-workspace">
    <div className="library-search-container">
      <LibrarySearch />
    </div>
    <MoviesView hideSearch />
    <PlacesList hideSearch />
  </div>
);

export default memo(LibraryWorkspace);
