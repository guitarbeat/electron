import React from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { Movie } from "@/shared/types";
import {
  DEFAULT_MOVIE_WALL_FILTERS,
  getMovieWallGenres,
  hasActiveMovieWallFilters,
  type MovieWallFilterState,
} from "./movieWallFilterUtils";

interface MovieWallFiltersProps {
  movies: Movie[];
  filters: MovieWallFilterState;
  resultCount: number;
  onChange: (filters: MovieWallFilterState) => void;
  hasSearch: boolean;
}

const formatLabels = {
  all: "All formats",
  movie: "Films",
  series: "TV shows",
  youtube: "YouTube",
} as const;

const progressLabels = {
  all: "Any status",
  unwatched: "Not watched",
  watching: "Watching",
  watched: "Watched",
} as const;

export const MovieWallFilters: React.FC<MovieWallFiltersProps> = ({
  movies,
  filters,
  resultCount,
  onChange,
  hasSearch,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const genres = React.useMemo(() => getMovieWallGenres(movies), [movies]);
  const isActive = hasActiveMovieWallFilters(filters);

  React.useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const update = <K extends keyof MovieWallFilterState>(
    key: K,
    value: MovieWallFilterState[K],
  ) => onChange({ ...filters, [key]: value });

  return (
    <div
      ref={rootRef}
      className={`movie-wall-filters${hasSearch ? " movie-wall-filters--below-search" : ""}`}
    >
      <button
        type="button"
        className={`movie-wall-filters__trigger${isActive ? " is-active" : ""}`}
        aria-expanded={isOpen}
        aria-controls="movie-wall-filter-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <SlidersHorizontal size={15} aria-hidden="true" />
        <span>{isActive ? `${resultCount} matching` : `Filter ${movies.length}`}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={isOpen ? "is-open" : ""}
        />
      </button>

      {isActive && !isOpen ? (
        <button
          type="button"
          className="movie-wall-filters__quick-clear"
          onClick={() => onChange(DEFAULT_MOVIE_WALL_FILTERS)}
          aria-label="Clear movie filters"
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}

      {isOpen ? (
        <div id="movie-wall-filter-panel" className="movie-wall-filters__panel">
          <div className="movie-wall-filters__heading">
            <div>
              <strong>Filter the wall</strong>
              <span>{resultCount} of {movies.length} titles</span>
            </div>
            {isActive ? (
              <button type="button" onClick={() => onChange(DEFAULT_MOVIE_WALL_FILTERS)}>
                Clear all
              </button>
            ) : null}
          </div>

          <label>
            <span>Format</span>
            <select
              value={filters.format}
              onChange={(event) => update("format", event.target.value as MovieWallFilterState["format"])}
            >
              {Object.entries(formatLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Genre</span>
            <select value={filters.genre} onChange={(event) => update("genre", event.target.value)}>
              <option value="all">All genres</option>
              {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </label>

          {(["Aaron", "Electra"] as const).map((user) => (
          <label key={user}>
            <span>{user}</span>
            <select
              value={filters[user]}
              onChange={(event) => update(user, event.target.value as MovieWallFilterState[typeof user])}
            >
              {Object.entries(progressLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          ))}

          <label>
            <span>Added by</span>
            <select
              value={filters.addedBy}
              onChange={(event) => update("addedBy", event.target.value as MovieWallFilterState["addedBy"])}
            >
              <option value="all">Aaron or Electra</option>
              <option value="Aaron">Aaron</option>
              <option value="Electra">Electra</option>
            </select>
          </label>

          <button type="button" className="movie-wall-filters__done" onClick={() => setIsOpen(false)}>
            <Check size={14} aria-hidden="true" />
            Show {resultCount} {resultCount === 1 ? "title" : "titles"}
          </button>
        </div>
      ) : null}
    </div>
  );
};
