import React from "react";
import { TopFramePanel, useTopFrame } from "@/app/TopFramePanels";
import { useExclusiveNotch } from "@/app/dynamicNotch";
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
import { SlidingSegments } from "./SettingsControls";
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
  /** View, Pick a movie, and sound controls shown under the filters in the same menu. */
  settingsSlot?: React.ReactNode;
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

const WATCH_STATUS_OPTIONS = [
  { value: "queue", artwork: "queue", label: "Queue", description: "Unwatched by both people" },
  { value: "in_progress", artwork: "watching", label: "Watching", description: "Started by either person" },
  { value: "both_watched", artwork: "seen", label: "Seen", description: "Completed by both people" },
] as const;

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

const PERSON_STATUSES = [
  { status: "all", label: "Any" },
  { status: "unwatched", label: "Queue" },
  { status: "watching", label: "Watching" },
  { status: "watched", label: "Seen" },
] as const;

const STATUS_GLYPHS: Record<Exclude<MovieProgressFilter, "all">, React.ReactNode> = {
  unwatched: <Clock size={9} strokeWidth={3} />,
  watching: <Eye size={9} strokeWidth={3} />,
  watched: <Check size={9} strokeWidth={3} />,
};

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
  settingsSlot,
}) => {
  const { modalOpen } = useTopFrame();
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  useExclusiveNotch("settings", isOpen, () => setIsOpen(false));

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
  const activeWatchStatus = WATCH_STATUS_OPTIONS.find((status) => status.value === filters.statusPreset);
  const focusWatchStatus = activeWatchStatus?.value ?? WATCH_STATUS_OPTIONS[0].value;

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

  // Controls that open another panel (Pick a movie) close this menu first.
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;
    const handleClick = (event: MouseEvent) => {
      // Defer so React still delivers the click to the control before this panel unmounts.
      if ((event.target as Element | null)?.closest("[data-closes-settings]")) window.setTimeout(() => setIsOpen(false), 0);
    };
    panel.addEventListener("click", handleClick);
    return () => panel.removeEventListener("click", handleClick);
  }, [isOpen]);

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
    onChange({
      ...filters,
      [user]: status,
      // Clear couple preset if setting individual viewer progress
      statusPreset: "all",
    });
  };

  const handleCycleViewerProgress = (user: User) => {
    onChange({ ...filters, [user]: cycleProgressFilter(filters[user]), statusPreset: "all" });
  };

  const clearAll = () => onChange({ ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: filters.sortBy });

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
      {/* Tactile Y2K Filter Deck trigger button */}
      <button
        type="button"
        className={`movie-wall-filters__trigger movie-wall-filters__trigger--artwork${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
        aria-expanded={isOpen}
        aria-controls="movie-wall-filter-panel"
        data-notch-trigger="bottom"
        aria-label={activeWatchStatus ? `Settings, ${activeWatchStatus.label}` : "Settings"}
        {...(activeWatchStatus ? { "data-watch-status": activeWatchStatus.artwork } : {})}
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
        <span className="movie-wall-filters__trigger-label">
          {activeWatchStatus ? activeWatchStatus.label : "Settings"}
          {activeWatchStatus ? (
            <span className="movie-wall-filters__trigger-count">{optionCounts.presets[activeWatchStatus.value]}</span>
          ) : null}
        </span>

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
              onClick={clearAll}
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
          className="movie-wall-filters__panel settings-menu"
          role="dialog"
          aria-labelledby="settings-menu-title"
          data-notch-panel="settings"
        >
          <header className="settings-menu__header">
            <h2 id="settings-menu-title" className="settings-menu__title">Settings</h2>
            <span className="settings-menu__result" aria-live="polite">
              {resultCount} {resultCount === 1 ? "title" : "titles"}
            </span>
            {isActive ? (
              <button type="button" className="settings-menu__clear" onClick={clearAll}>
                Clear all
              </button>
            ) : null}
            <button
              type="button"
              className="settings-menu__close"
              onClick={() => setIsOpen(false)}
              data-tv-close
              aria-label="Close settings"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </header>

          <section className="settings-menu__section" aria-labelledby="settings-menu-status">
            <h3 id="settings-menu-status" className="settings-menu__label">Status</h3>
            <SlidingSegments
              label="Watch status filters"
              mode="toggle"
              className="settings-menu__seg--status"
              value={activeWatchStatus?.value ?? null}
              onSelect={handleSelectCouplePreset}
              options={WATCH_STATUS_OPTIONS.map((status) => ({
                value: status.value,
                ariaLabel: `${status.label}: ${optionCounts.presets[status.value]} titles`,
                title: status.description,
                empty: optionCounts.presets[status.value] === 0,
                autofocus: status.value === focusWatchStatus,
                content: (
                  <>
                    <WatchStatusArtwork status={status.artwork} className="settings-menu__status-art" />
                    <span>{status.label}</span>
                    <span className="settings-menu__count">{optionCounts.presets[status.value]}</span>
                  </>
                ),
              }))}
            />
          </section>

          <section className="settings-menu__section" aria-labelledby="settings-menu-people">
            <h3 id="settings-menu-people" className="settings-menu__label">By person</h3>
            <div className="settings-menu__people">
              {(["Aaron", "Electra"] as const).map((user) => {
                const cfg = PARTNER_CONFIG[user];
                const isPickedByUser = filters.addedBy === user;
                return (
                  <div key={user} className={`settings-menu__person ${cfg.toneClass}`}>
                    <button
                      type="button"
                      className="settings-menu__person-name"
                      onClick={() => handleCycleViewerProgress(user)}
                      aria-label={`Cycle ${user} watch status filter. Currently ${progressLabels[filters[user]]}`}
                      title={`Cycle ${user}'s watch status`}
                    >
                      <span key={filters[user]} className="settings-menu__avatar-wrap" data-status={filters[user]}>
                        <img src={cfg.avatarSrc} alt="" className="settings-menu__avatar" />
                        {filters[user] !== "all" ? (
                          <span className="settings-menu__avatar-badge" aria-hidden="true">
                            {STATUS_GLYPHS[filters[user]]}
                          </span>
                        ) : null}
                      </span>
                      {user}
                    </button>
                    <SlidingSegments
                      label={`${user} watch status`}
                      value={filters[user]}
                      onSelect={(status) => handleSelectViewerProgress(user, status)}
                      options={PERSON_STATUSES.map(({ status, label }) => {
                        const count = optionCounts.viewers[user][status];
                        return {
                          value: status,
                          ariaLabel: status === "all" ? `${user}: any status` : `${user}: ${label}, ${count} titles`,
                          empty: status !== "all" && count === 0,
                          content: (
                            <>
                              <span>{label}</span>
                              {status !== "all" ? <span className="settings-menu__count">{count}</span> : null}
                            </>
                          ),
                        };
                      })}
                    />
                    <button
                      type="button"
                      className={`settings-menu__opt settings-menu__picked${isPickedByUser ? " is-active" : ""}`}
                      onClick={() => handleToggleAddedBy(user)}
                      aria-pressed={isPickedByUser}
                      aria-label={`Picked by ${user}: ${optionCounts.addedBy[user]} titles`}
                    >
                      <Star size={12} aria-hidden="true" />
                      <span>Picked</span>
                      <span className="settings-menu__count">{optionCounts.addedBy[user]}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="settings-menu__columns">
            <section className="settings-menu__section" aria-labelledby="settings-menu-format">
              <h3 id="settings-menu-format" className="settings-menu__label">Format</h3>
              <SlidingSegments
                label="Format"
                value={filters.format}
                onSelect={(value) => update("format", value)}
                options={FORMAT_CARTRIDGES.filter(
                  ({ value }) => value === "all" || optionCounts.formats[value] > 0 || filters.format === value,
                ).map(({ value, label, icon: Icon }) => ({
                  value,
                  content: (
                    <>
                      <Icon size={12} aria-hidden="true" />
                      <span>{label}</span>
                      <span className="settings-menu__count">{optionCounts.formats[value]}</span>
                    </>
                  ),
                }))}
              />
            </section>

            <section className="settings-menu__section" aria-labelledby="settings-menu-sort">
              <h3 id="settings-menu-sort" className="settings-menu__label">Sort by</h3>
              <SlidingSegments
                label="Sort by"
                value={currentSort}
                onSelect={(value) => update("sortBy", value)}
                options={SORT_OPTIONS.map((opt) => ({
                  value: opt.value,
                  title: opt.description,
                  content: (
                    <>
                      <opt.icon size={12} aria-hidden="true" />
                      <span>{opt.shortLabel}</span>
                    </>
                  ),
                }))}
              />
            </section>
          </div>

          {genres.length > 0 ? (
            <section className="settings-menu__section" aria-labelledby="settings-menu-genre">
              <h3 id="settings-menu-genre" className="settings-menu__label">Genre</h3>
              <div className="settings-menu__chips" role="radiogroup" aria-label="Genre">
                <button
                  type="button"
                  role="radio"
                  className={`settings-menu__chip${filters.genre === "all" ? " is-active" : ""}`}
                  onClick={() => update("genre", "all")}
                  aria-checked={filters.genre === "all"}
                >
                  <Check size={11} className="settings-menu__check" aria-hidden="true" />
                  <span>All</span>
                  <span className="settings-menu__count">{movies.length}</span>
                </button>
                {genreCounts.map(({ genre, count }) => {
                  const isSelected = filters.genre.toLowerCase() === genre.toLowerCase();
                  return (
                    <button
                      key={genre}
                      type="button"
                      role="radio"
                      className={`settings-menu__chip${isSelected ? " is-active" : ""}`}
                      onClick={() => update("genre", genre)}
                      aria-checked={isSelected}
                    >
                      <Check size={11} className="settings-menu__check" aria-hidden="true" />
                      <span>{genre}</span>
                      <span className="settings-menu__count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {settingsSlot ? (
            <section className="settings-menu__section" aria-labelledby="settings-menu-view">
              <h3 id="settings-menu-view" className="settings-menu__label">View &amp; sounds</h3>
              <div className="settings-menu__view">{settingsSlot}</div>
            </section>
          ) : null}
        </div>
        </TopFramePanel>
      ) : null}
    </div>
  );
};

export default MovieWallFilters;

