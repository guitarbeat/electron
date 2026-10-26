import React from "react";
import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  Film,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Tv,
  Video,
  X,
} from "lucide-react";
import type { Movie } from "@/shared/types";
import {
  DEFAULT_MOVIE_WALL_FILTERS,
  getActiveFilterCount,
  getMovieWallGenreCounts,
  getMovieWallGenres,
  hasActiveMovieWallFilters,
  type MovieSortOrder,
  type MovieStatusPreset,
  type MovieWallFilterState,
} from "./movieWallFilterUtils";

interface MovieWallFiltersProps {
  movies: Movie[];
  filters: MovieWallFilterState;
  resultCount: number;
  onChange: (filters: MovieWallFilterState) => void;
  hasSearch?: boolean;
}

const formatLabels = {
  all: "All formats",
  movie: "Films",
  series: "TV shows",
  youtube: "YouTube",
} as const;

const progressLabels = {
  all: "Any",
  unwatched: "Queue",
  watching: "Watching",
  watched: "Watched",
} as const;

const statusPresetLabels: Record<MovieStatusPreset, string> = {
  all: "Any status",
  queue: "In Queue",
  in_progress: "In Progress",
  both_watched: "Both Watched",
};

const SORT_OPTIONS: Array<{
  value: MovieSortOrder;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Calendar;
}> = [
  {
    value: "recent",
    label: "Date Added",
    shortLabel: "Date Added",
    description: "Newest additions first",
    icon: Calendar,
  },
  {
    value: "alpha",
    label: "Alphabetical",
    shortLabel: "A–Z",
    description: "Title alphabetical order (A to Z)",
    icon: ArrowDownAZ,
  },
  {
    value: "genre",
    label: "Genre",
    shortLabel: "Genre",
    description: "Grouped by genre category",
    icon: Tag,
  },
  {
    value: "rating",
    label: "IMDb Rating",
    shortLabel: "Rating",
    description: "Highest rated titles first",
    icon: Star,
  },
];

export const MovieWallFilters: React.FC<MovieWallFiltersProps> = ({
  movies,
  filters,
  resultCount,
  onChange,
  hasSearch = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const sortRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const genres = React.useMemo(() => getMovieWallGenres(movies), [movies]);
  const genreCounts = React.useMemo(
    () => getMovieWallGenreCounts(movies),
    [movies],
  );

  const isActive = hasActiveMovieWallFilters(filters);
  const activeCount = getActiveFilterCount(filters);

  const currentSort = filters.sortBy ?? "recent";
  const activeSortConfig =
    SORT_OPTIONS.find((opt) => opt.value === currentSort) ?? SORT_OPTIONS[0];

  React.useEffect(() => {
    if (!isOpen && !isSortOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node;
      if (isOpen && !rootRef.current?.contains(targetNode)) {
        setIsOpen(false);
      }
      if (isSortOpen && !sortRef.current?.contains(targetNode)) {
        setIsSortOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsSortOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSortOpen]);

  const update = <K extends keyof MovieWallFilterState>(
    key: K,
    value: MovieWallFilterState[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const handleSelectSort = (sortValue: MovieSortOrder) => {
    update("sortBy", sortValue);
    setIsSortOpen(false);
  };

  // Build active filter tags for quick 1-click removal
  const activeTags: Array<{
    id: string;
    label: string;
    onRemove: () => void;
  }> = [];

  if (filters.query?.trim()) {
    activeTags.push({
      id: "query",
      label: `"${filters.query.trim()}"`,
      onRemove: () => update("query", ""),
    });
  }

  if (filters.format !== "all") {
    activeTags.push({
      id: "format",
      label: formatLabels[filters.format],
      onRemove: () => update("format", "all"),
    });
  }

  if (filters.genre !== "all") {
    activeTags.push({
      id: "genre",
      label: filters.genre,
      onRemove: () => update("genre", "all"),
    });
  }

  if (filters.statusPreset && filters.statusPreset !== "all") {
    activeTags.push({
      id: "statusPreset",
      label: statusPresetLabels[filters.statusPreset],
      onRemove: () => update("statusPreset", "all"),
    });
  }

  if (filters.Aaron !== "all") {
    activeTags.push({
      id: "Aaron",
      label: `Aaron: ${progressLabels[filters.Aaron]}`,
      onRemove: () => update("Aaron", "all"),
    });
  }

  if (filters.Electra !== "all") {
    activeTags.push({
      id: "Electra",
      label: `Electra: ${progressLabels[filters.Electra]}`,
      onRemove: () => update("Electra", "all"),
    });
  }

  if (filters.addedBy !== "all") {
    activeTags.push({
      id: "addedBy",
      label: `Added by ${filters.addedBy}`,
      onRemove: () => update("addedBy", "all"),
    });
  }

  return (
    <div
      ref={rootRef}
      className={`movie-wall-filters${hasSearch ? " movie-wall-filters--below-search" : ""}`}
    >
      {/* Filter modal trigger button */}
      <button
        type="button"
        className={`movie-wall-filters__trigger${isActive ? " is-active" : ""}`}
        aria-expanded={isOpen}
        aria-controls="movie-wall-filter-panel"
        onClick={() => {
          setIsOpen((open) => !open);
          setIsSortOpen(false);
        }}
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        <span className="movie-wall-filters__trigger-label">
          {isActive ? `${resultCount} matching` : `Filter (${movies.length})`}
        </span>
        {activeCount > 0 ? (
          <span
            className="movie-wall-filters__badge"
            aria-label={`${activeCount} active ${activeCount === 1 ? "filter" : "filters"}`}
          >
            {activeCount}
          </span>
        ) : null}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`movie-wall-filters__chevron${isOpen ? " is-open" : ""}`}
        />
      </button>

      {/* Sorting Dropdown */}
      <div className="movie-wall-sort" ref={sortRef}>
        <button
          type="button"
          className={`movie-wall-sort__trigger${isSortOpen ? " is-open" : ""}`}
          aria-haspopup="listbox"
          aria-expanded={isSortOpen}
          aria-label={`Sort watchlist by: ${activeSortConfig.label}`}
          onClick={() => {
            setIsSortOpen((open) => !open);
            setIsOpen(false);
          }}
        >
          <ArrowUpDown size={13} aria-hidden="true" />
          <span className="movie-wall-sort__label">
            Sort: <strong>{activeSortConfig.shortLabel}</strong>
          </span>
          <ChevronDown
            size={13}
            aria-hidden="true"
            className={`movie-wall-filters__chevron${isSortOpen ? " is-open" : ""}`}
          />
        </button>

        {isSortOpen ? (
          <div
            className="movie-wall-sort__dropdown"
            role="listbox"
            aria-label="Sort watchlist by"
          >
            <div className="movie-wall-sort__header">
              <span>Sort Order</span>
            </div>
            {SORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = currentSort === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`movie-wall-sort__option${isSelected ? " is-selected" : ""}`}
                  onClick={() => handleSelectSort(option.value)}
                >
                  <Icon size={14} className="movie-wall-sort__option-icon" aria-hidden="true" />
                  <div className="movie-wall-sort__option-text">
                    <span className="movie-wall-sort__option-title">{option.label}</span>
                    <span className="movie-wall-sort__option-desc">{option.description}</span>
                  </div>
                  {isSelected ? (
                    <Check size={14} className="movie-wall-sort__option-check" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isActive && !isOpen ? (
        <button
          type="button"
          className="movie-wall-filters__quick-clear"
          onClick={() => onChange({ ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: filters.sortBy })}
          aria-label="Clear all movie filters"
          title="Clear all filters"
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}

      {/* Active tags row (visible when filters are applied) */}
      {activeTags.length > 0 ? (
        <div className="movie-wall-filters__tags" role="list" aria-label="Active filters">
          {activeTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="movie-wall-filters__tag"
              onClick={tag.onRemove}
              title={`Remove ${tag.label} filter`}
              aria-label={`Remove ${tag.label} filter`}
            >
              <span>{tag.label}</span>
              <X size={11} aria-hidden="true" />
            </button>
          ))}
          {activeTags.length > 1 ? (
            <button
              type="button"
              className="movie-wall-filters__tag movie-wall-filters__tag--clear-all"
              onClick={() => onChange({ ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: filters.sortBy })}
              title="Clear all filters"
              aria-label="Clear all filters"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}

      {isOpen ? (
        <div
          id="movie-wall-filter-panel"
          className="movie-wall-filters__panel"
          role="dialog"
          aria-label="Filter collection"
        >
          {/* Header */}
          <div className="movie-wall-filters__heading">
            <div className="movie-wall-filters__heading-info">
              <div className="movie-wall-filters__title-row">
                <SlidersHorizontal size={14} aria-hidden="true" />
                <strong>Filter Collection</strong>
                {activeCount > 0 ? (
                  <span className="movie-wall-filters__panel-badge">
                    {activeCount} active
                  </span>
                ) : null}
              </div>
              <span className="movie-wall-filters__subtitle">
                {resultCount} of {movies.length} titles matching
              </span>
            </div>
            <div className="movie-wall-filters__heading-actions">
              {isActive ? (
                <button
                  type="button"
                  className="movie-wall-filters__reset-btn"
                  onClick={() => onChange({ ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: filters.sortBy })}
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  Reset
                </button>
              ) : null}
              <button
                type="button"
                className="movie-wall-filters__close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close filters"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="movie-wall-filters__search-wrap">
            <Search size={14} className="movie-wall-filters__search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className="movie-wall-filters__search-input"
              placeholder="Search title, director, keyword..."
              value={filters.query ?? ""}
              onChange={(e) => update("query", e.target.value)}
              aria-label="Filter by title, director, or keyword"
            />
            {filters.query ? (
              <button
                type="button"
                className="movie-wall-filters__search-clear"
                onClick={() => update("query", "")}
                aria-label="Clear search filter"
              >
                <X size={12} aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {/* Sort By Section in Filter Panel */}
          <div className="movie-wall-filters__section">
            <div className="movie-wall-filters__section-title">Order Watchlist By</div>
            <div className="movie-wall-filters__pills-row">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`movie-wall-filters__pill${currentSort === opt.value ? " is-active" : ""}`}
                  onClick={() => update("sortBy", opt.value)}
                >
                  <opt.icon size={12} aria-hidden="true" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Media Format */}
          <div className="movie-wall-filters__section">
            <div className="movie-wall-filters__section-title">Format</div>
            <div className="movie-wall-filters__pills-grid">
              <button
                type="button"
                className={`movie-wall-filters__pill${filters.format === "all" ? " is-active" : ""}`}
                onClick={() => update("format", "all")}
              >
                All Formats
              </button>
              <button
                type="button"
                className={`movie-wall-filters__pill${filters.format === "movie" ? " is-active" : ""}`}
                onClick={() => update("format", "movie")}
              >
                <Film size={12} aria-hidden="true" />
                Films
              </button>
              <button
                type="button"
                className={`movie-wall-filters__pill${filters.format === "series" ? " is-active" : ""}`}
                onClick={() => update("format", "series")}
              >
                <Tv size={12} aria-hidden="true" />
                TV Series
              </button>
              <button
                type="button"
                className={`movie-wall-filters__pill${filters.format === "youtube" ? " is-active" : ""}`}
                onClick={() => update("format", "youtube")}
              >
                <Video size={12} aria-hidden="true" />
                YouTube
              </button>
            </div>
          </div>

          {/* Quick Status Presets */}
          <div className="movie-wall-filters__section">
            <div className="movie-wall-filters__section-title">Watch Status</div>
            <div className="movie-wall-filters__pills-row">
              {(
                [
                  { value: "all", label: "Any status" },
                  { value: "queue", label: "In Queue" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "both_watched", label: "Both Watched" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`movie-wall-filters__pill${(filters.statusPreset ?? "all") === value ? " is-active" : ""}`}
                  onClick={() => update("statusPreset", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Viewer Watch Progress */}
          <div className="movie-wall-filters__section">
            <div className="movie-wall-filters__section-title">Progress by Viewer</div>
            <div className="movie-wall-filters__viewers-grid">
              {(["Aaron", "Electra"] as const).map((user) => (
                <div key={user} className="movie-wall-filters__viewer-row">
                  <span className="movie-wall-filters__viewer-name">{user}</span>
                  <div className="movie-wall-filters__segmented">
                    {(["all", "unwatched", "watching", "watched"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`movie-wall-filters__segment-btn${filters[user] === status ? " is-active" : ""}`}
                        onClick={() => update(user, status)}
                      >
                        {status === "all" ? "Any" : progressLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Added By */}
          <div className="movie-wall-filters__section">
            <div className="movie-wall-filters__section-title">Added by</div>
            <div className="movie-wall-filters__pills-row">
              {(
                [
                  { value: "all", label: "Everyone" },
                  { value: "Aaron", label: "Aaron" },
                  { value: "Electra", label: "Electra" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`movie-wall-filters__pill${filters.addedBy === value ? " is-active" : ""}`}
                  onClick={() => update("addedBy", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Cloud */}
          {genres.length > 0 ? (
            <div className="movie-wall-filters__section">
              <div className="movie-wall-filters__section-header">
                <span className="movie-wall-filters__section-title">Genres</span>
                {filters.genre !== "all" ? (
                  <button
                    type="button"
                    className="movie-wall-filters__sub-reset"
                    onClick={() => update("genre", "all")}
                  >
                    Clear genre
                  </button>
                ) : null}
              </div>
              <div className="movie-wall-filters__genres-cloud">
                <button
                  type="button"
                  className={`movie-wall-filters__genre-chip${filters.genre === "all" ? " is-active" : ""}`}
                  onClick={() => update("genre", "all")}
                >
                  All ({movies.length})
                </button>
                {genreCounts.map(({ genre, count }) => {
                  const isSelected =
                    filters.genre.toLowerCase() === genre.toLowerCase();
                  return (
                    <button
                      key={genre}
                      type="button"
                      className={`movie-wall-filters__genre-chip${isSelected ? " is-active" : ""}`}
                      onClick={() => update("genre", isSelected ? "all" : genre)}
                    >
                      <span>{genre}</span>
                      <span className="movie-wall-filters__genre-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Footer Action */}
          <div className="movie-wall-filters__footer">
            <button
              type="button"
              className="movie-wall-filters__done"
              onClick={() => setIsOpen(false)}
            >
              <Check size={14} aria-hidden="true" />
              <span>
                Show {resultCount} {resultCount === 1 ? "title" : "titles"}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MovieWallFilters;
