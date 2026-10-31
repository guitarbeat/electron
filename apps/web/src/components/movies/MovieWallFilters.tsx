import React from "react";
import { TopFramePanel, useTopFrame } from "@/app/TopFramePanels";
import {
  ArrowDownAZ,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Eye,
  Film,
  Layers,
  RotateCcw,
  Star,
  Tag,
  Tv,
  Video,
  X,
} from "lucide-react";
import { WatchStatusArtwork } from "./WatchStatusArtwork";
import type { Movie, User } from "@/shared/types";
import {
  cycleProgressFilter,
  DEFAULT_MOVIE_WALL_FILTERS,
  getMovieWallGenreCounts,
  getMovieWallGenres,
  getMovieWallOptionCounts,
  hasActiveMovieWallFilters,
  type MovieFormatFilter,
  type MovieProgressFilter,
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

const formatLabels: Record<MovieFormatFilter, string> = {
  all: "All Formats",
  movie: "Films",
  series: "TV Shows",
  youtube: "YouTube",
};

const progressLabels: Record<MovieProgressFilter, string> = {
  all: "Any",
  unwatched: "Queue",
  watching: "Watching",
  watched: "Seen",
};

const statusPresetLabels: Record<MovieStatusPreset, string> = {
  all: "All Titles",
  queue: "Movie Night Queue",
  in_progress: "Finish Watching",
  both_watched: "Watched Together",
};

const FORMAT_CARTRIDGES: Array<{
  value: MovieFormatFilter;
  label: string;
  icon: typeof Layers;
}> = [
  { value: "all", label: "All", icon: Layers },
  { value: "movie", label: "Films", icon: Film },
  { value: "series", label: "Shows", icon: Tv },
  { value: "youtube", label: "YouTube", icon: Video },
];

const PARTNER_CONFIG: Record<
  User,
  {
    playerTag: string;
    avatarSrc: string;
    toneClass: string;
  }
> = {
  Aaron: {
    playerTag: "P1",
    avatarSrc: "/avatars/aaron-avatar-eyes.png",
    toneClass: "is-aaron",
  },
  Electra: {
    playerTag: "P2",
    avatarSrc: "/electra-button.png",
    toneClass: "is-electra",
  },
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
    shortLabel: "IMDb",
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
  const { modalOpen } = useTopFrame();
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const genres = React.useMemo(() => getMovieWallGenres(movies), [movies]);
  const genreCounts = React.useMemo(
    () => getMovieWallGenreCounts(movies),
    [movies],
  );
  const optionCounts = React.useMemo(
    () => getMovieWallOptionCounts(movies),
    [movies],
  );

  const isActive = hasActiveMovieWallFilters(filters);

  const currentSort = filters.sortBy ?? "recent";
  const isAaronFiltered =
    filters.Aaron !== "all" || filters.addedBy === "Aaron";
  const isElectraFiltered =
    filters.Electra !== "all" || filters.addedBy === "Electra";

  React.useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node;
      if (modalOpen) return;
      if (isOpen && !rootRef.current?.contains(targetNode) && !panelRef.current?.contains(targetNode)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!modalOpen && !event.defaultPrevented && event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, modalOpen]);

  const update = <K extends keyof MovieWallFilterState>(
    key: K,
    value: MovieWallFilterState[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const handleSelectCouplePreset = (preset: MovieStatusPreset) => {
    const currentPreset = filters.statusPreset ?? "all";
    const nextPreset =
      preset !== "all" && currentPreset === preset ? "all" : preset;
    onChange({
      ...filters,
      statusPreset: nextPreset,
      // Clear individual viewer progress overrides so the couple preset applies cleanly
      Aaron: "all",
      Electra: "all",
    });
  };

  const handleSelectViewerProgress = (
    user: User,
    status: MovieProgressFilter,
  ) => {
    const nextStatus =
      status !== "all" && filters[user] === status ? "all" : status;
    onChange({
      ...filters,
      [user]: nextStatus,
      // Clear couple preset if setting individual viewer progress
      statusPreset: "all",
    });
  };

  const handleCycleViewerProgress = (user: User) => {
    const nextStatus = cycleProgressFilter(filters[user]);
    onChange({
      ...filters,
      [user]: nextStatus,
      statusPreset: "all",
    });
  };

  const handleToggleAddedBy = (user: User) => {
    const nextAddedBy = filters.addedBy === user ? "all" : user;
    update("addedBy", nextAddedBy);
  };

  // Build active filter tags for quick 1-click removal
  const activeTags: Array<{
    id: string;
    label: string;
    tone: "default" | "aaron" | "electra" | "couple" | "format";
    avatarSrc?: string;
    onRemove: () => void;
  }> = [];

  if (filters.query?.trim()) {
    activeTags.push({
      id: "query",
      label: `"${filters.query.trim()}"`,
      tone: "default",
      onRemove: () => update("query", ""),
    });
  }

  if (filters.statusPreset && !["all", "queue", "in_progress", "both_watched"].includes(filters.statusPreset)) {
    activeTags.push({
      id: "statusPreset",
      label: statusPresetLabels[filters.statusPreset],
      tone: "couple",
      onRemove: () => update("statusPreset", "all"),
    });
  }

  if (filters.Aaron !== "all") {
    activeTags.push({
      id: "Aaron",
      label: `Aaron: ${progressLabels[filters.Aaron]}`,
      tone: "aaron",
      avatarSrc: PARTNER_CONFIG.Aaron.avatarSrc,
      onRemove: () => update("Aaron", "all"),
    });
  }

  if (filters.Electra !== "all") {
    activeTags.push({
      id: "Electra",
      label: `Electra: ${progressLabels[filters.Electra]}`,
      tone: "electra",
      avatarSrc: PARTNER_CONFIG.Electra.avatarSrc,
      onRemove: () => update("Electra", "all"),
    });
  }

  if (filters.addedBy !== "all") {
    const addedUser = filters.addedBy;
    activeTags.push({
      id: "addedBy",
      label: `Picked by ${addedUser}`,
      tone: addedUser === "Aaron" ? "aaron" : "electra",
      avatarSrc: PARTNER_CONFIG[addedUser].avatarSrc,
      onRemove: () => update("addedBy", "all"),
    });
  }

  if (filters.format !== "all") {
    activeTags.push({
      id: "format",
      label: formatLabels[filters.format],
      tone: "format",
      onRemove: () => update("format", "all"),
    });
  }

  if (filters.genre !== "all") {
    activeTags.push({
      id: "genre",
      label: filters.genre,
      tone: "default",
      onRemove: () => update("genre", "all"),
    });
  }

  return (
    <div
      ref={rootRef}
      className={`movie-wall-filters${hasSearch ? " movie-wall-filters--below-search" : ""}`}
    >
      <div className="movie-wall-status-buttons" role="group" aria-label="Watch status filters">
        {([
          { value: "queue", artwork: "queue", label: "Queue", description: "Unwatched by both people" },
          { value: "in_progress", artwork: "watching", label: "Watching", description: "Started by either person" },
          { value: "both_watched", artwork: "seen", label: "Seen", description: "Completed by both people" },
        ] as const).map((status) => (
          <button
            key={status.value}
            type="button"
            className="movie-wall-status-button"
            aria-pressed={filters.statusPreset === status.value}
            aria-label={`${status.label}: ${optionCounts.presets[status.value]} titles`}
            title={status.description}
            onClick={() => handleSelectCouplePreset(status.value)}
          >
            <WatchStatusArtwork status={status.artwork} className="movie-wall-status-button__art" />
            <span className="movie-wall-status-button__label">
              {status.label}<span className="movie-wall-status-button__count">{optionCounts.presets[status.value]}</span>
            </span>
          </button>
        ))}
      </div>
      {/* Tactile Y2K Filter Deck trigger button */}
      <button
        type="button"
        className={`movie-wall-filters__trigger movie-wall-filters__trigger--artwork${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
        aria-expanded={isOpen}
        aria-controls="movie-wall-filter-panel"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <svg
          className="movie-wall-filters__trigger-art"
          viewBox="240 325 970 460"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          <image href="/avatars/aaron-electra-filter-sliders.png" width="1448" height="1086" />
        </svg>
        <span className="movie-wall-filters__trigger-label">Filter</span>

        {/* Mini avatar pips when Aaron or Electra filters are active */}
        {isAaronFiltered || isElectraFiltered ? (
          <span
            className="movie-wall-filters__trigger-avatars"
            aria-hidden="true"
          >
            {isAaronFiltered ? (
              <img
                src={PARTNER_CONFIG.Aaron.avatarSrc}
                alt=""
                className="movie-wall-filters__trigger-avatar is-aaron"
              />
            ) : null}
            {isElectraFiltered ? (
              <img
                src={PARTNER_CONFIG.Electra.avatarSrc}
                alt=""
                className="movie-wall-filters__trigger-avatar is-electra"
              />
            ) : null}
          </span>
        ) : null}

        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`movie-wall-filters__chevron${isOpen ? " is-open" : ""}`}
        />
      </button>

      {/* Color-coded active tags ribbon below the command dock */}
      {activeTags.length > 0 ? (
        <div
          className="movie-wall-filters__tags"
          role="list"
          aria-label="Active filters"
        >
          {activeTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`movie-wall-filters__tag movie-wall-filters__tag--${tag.tone}`}
              onClick={tag.onRemove}
              title={`Remove ${tag.label} filter`}
              aria-label={`Remove ${tag.label} filter`}
            >
              {tag.avatarSrc ? (
                <img
                  src={tag.avatarSrc}
                  alt=""
                  className="movie-wall-filters__tag-avatar"
                  aria-hidden="true"
                />
              ) : null}
              <span>{tag.label}</span>
              <X size={11} aria-hidden="true" />
            </button>
          ))}
          {activeTags.length > 1 ? (
            <button
              type="button"
              className="movie-wall-filters__tag movie-wall-filters__tag--clear-all"
              onClick={() =>
                onChange({
                  ...DEFAULT_MOVIE_WALL_FILTERS,
                  sortBy: filters.sortBy,
                })
              }
              title="Clear all filters"
              aria-label="Clear all filters"
            >
              <RotateCcw size={11} aria-hidden="true" />
              <span>Reset</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {isOpen ? (
        <TopFramePanel name="filters">
        <div
          ref={panelRef}
          id="movie-wall-filter-panel"
          className="movie-wall-filters__panel"
          role="dialog"
          aria-label="Movie filters"
        >
          {/* 2. Interactive Partner Avatar Player Cards (Aaron P1 & Electra P2) */}
          <div className="movie-wall-filters__section">
            <div className="movie-wall-filters__section-header">
              <span className="movie-wall-filters__section-title">
                By person
              </span>
              <button
                type="button"
                className="movie-wall-filters__close-btn"
                onClick={() => setIsOpen(false)}
                data-tv-close
                aria-label="Close filters"
              >
                <X size={15} aria-hidden="true" />
              </button>
              {filters.Aaron !== "all" ||
              filters.Electra !== "all" ||
              filters.addedBy !== "all" ? (
                <button
                  type="button"
                  className="movie-wall-filters__sub-reset"
                  onClick={() =>
                    onChange({
                      ...filters,
                      Aaron: "all",
                      Electra: "all",
                      addedBy: "all",
                    })
                  }
                >
                  Reset players
                </button>
              ) : null}
            </div>

            <div className="movie-wall-filters__players-grid">
              {(["Aaron", "Electra"] as const).map((user) => {
                const cfg = PARTNER_CONFIG[user];
                const currentStatus = filters[user];
                const isPickedByUser = filters.addedBy === user;
                const isPlayerActive =
                  currentStatus !== "all" || isPickedByUser;

                return (
                  <div
                    key={user}
                    className={`movie-wall-filters__player-card ${cfg.toneClass}${isPlayerActive ? " is-active" : ""}`}
                  >
                    <div className="movie-wall-filters__player-header">
                      <button
                        type="button"
                        className={`movie-wall-filters__player-avatar-btn status-${currentStatus}`}
                        onClick={() => handleCycleViewerProgress(user)}
                        title={`Tap to cycle ${user}'s watch filter (${progressLabels[currentStatus]})`}
                        aria-label={`Cycle ${user} watch status filter. Currently ${progressLabels[currentStatus]}`}
                      >
                        <span className="movie-wall-filters__player-avatar-wrap">
                          <img
                            src={cfg.avatarSrc}
                            alt={user}
                            className="movie-wall-filters__player-avatar"
                          />

                        </span>
                        <span className="movie-wall-filters__player-identity">
                          <span className="movie-wall-filters__player-name">
                            {user}
                          </span>
                          <span className="movie-wall-filters__player-cycle-hint">
                            {currentStatus === "all"
                              ? "Tap to cycle"
                              : progressLabels[currentStatus]}
                          </span>
                        </span>
                      </button>

                      {/* 1-tap "Picked by" toggle pill */}
                      <button
                        type="button"
                        className={`movie-wall-filters__picked-btn${isPickedByUser ? " is-active" : ""}`}
                        onClick={() => handleToggleAddedBy(user)}
                        aria-pressed={isPickedByUser}
                        title={`Filter titles added by ${user} (${optionCounts.addedBy[user]})`}
                      >
                        <Star size={11} aria-hidden="true" />
                        <span>Picked ({optionCounts.addedBy[user]})</span>
                      </button>
                    </div>

                    {/* 4-button status strip with live counts */}
                    <div
                      className="movie-wall-filters__player-segments"
                      role="group"
                      aria-label={`${user} watch status`}
                    >
                      {(
                        [
                          { status: "all", label: "Any", icon: null },
                          { status: "unwatched", label: "Queue", icon: Clock },
                          { status: "watching", label: "Watching", icon: Eye },
                          { status: "watched", label: "Seen", icon: Check },
                        ] as const
                      ).map(({ status, label }) => {
                        const isSegActive = currentStatus === status;
                        const statusCount = optionCounts.viewers[user][status];
                        return (
                          <button
                            key={status}
                            type="button"
                            className={`movie-wall-filters__player-seg-btn${isSegActive ? " is-active" : ""}`}
                            onClick={() =>
                              handleSelectViewerProgress(user, status)
                            }
                            aria-pressed={isSegActive}
                          >
                            <span className="movie-wall-filters__player-seg-label">
                              {label}
                            </span>
                            {status !== "all" ? (
                              <span className="movie-wall-filters__player-seg-count">
                                {statusCount}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Format (4-column tactile buttons with live counts) */}
          <div className="movie-wall-filters__section">
            <div className="movie-wall-filters__section-header">
              <span className="movie-wall-filters__section-title">
                Format
              </span>
              {filters.format !== "all" ? (
                <button
                  type="button"
                  className="movie-wall-filters__sub-reset"
                  onClick={() => update("format", "all")}
                >
                  All formats
                </button>
              ) : null}
            </div>
            <div className="movie-wall-filters__format-grid">
              {FORMAT_CARTRIDGES.map(({ value, label, icon: Icon }) => {
                const isSelected = filters.format === value;
                const count = optionCounts.formats[value];
                return (
                  <button
                    key={value}
                    type="button"
                    className={`movie-wall-filters__format-btn${isSelected ? " is-active" : ""}`}
                    onClick={() =>
                      update(
                        "format",
                        value !== "all" && isSelected ? "all" : value,
                      )
                    }
                    aria-pressed={isSelected}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span className="movie-wall-filters__format-label">
                      {label}
                    </span>
                    <span className="movie-wall-filters__format-count">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Genre Cloud & Sort Strip */}
          {genres.length > 0 ? (
            <div className="movie-wall-filters__section">
              <div className="movie-wall-filters__section-header">
                <span className="movie-wall-filters__section-title">
                  Genre
                </span>
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
                  <span>All Genres</span>
                  <span className="movie-wall-filters__genre-count">
                    {movies.length}
                  </span>
                </button>
                {genreCounts.map(({ genre, count }) => {
                  const isSelected =
                    filters.genre.toLowerCase() === genre.toLowerCase();
                  return (
                    <button
                      key={genre}
                      type="button"
                      className={`movie-wall-filters__genre-chip${isSelected ? " is-active" : ""}`}
                      onClick={() =>
                        update("genre", isSelected ? "all" : genre)
                      }
                    >
                      <span>{genre}</span>
                      <span className="movie-wall-filters__genre-count">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* 5. Compact Sort Order Strip */}
          <div className="movie-wall-filters__section">
            <div className="movie-wall-filters__section-title">
              Order Watchlist By
            </div>
            <div className="movie-wall-filters__sort-grid">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = currentSort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`movie-wall-filters__pill${isSelected ? " is-active" : ""}`}
                    onClick={() => update("sortBy", opt.value)}
                  >
                    <Icon size={12} aria-hidden="true" />
                    <span>{opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action */}
          <div className="movie-wall-filters__footer">
            <button
              type="button"
              className="movie-wall-filters__done"
              data-tv-close
              onClick={() => setIsOpen(false)}
            >
              <Check size={14} aria-hidden="true" />
              <span>
                Show {resultCount} {resultCount === 1 ? "title" : "titles"}
              </span>
            </button>
          </div>
        </div>
        </TopFramePanel>
      ) : null}
    </div>
  );
};

export default MovieWallFilters;

