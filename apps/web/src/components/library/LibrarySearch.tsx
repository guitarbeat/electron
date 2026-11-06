/* ==========================================================================
   LibrarySearch Component
   --------------------------------------------------------------------------
   Section 1: Imports & Lazy Panels
   Section 2: Component Interfaces & Types
   Section 3: Component Setup & State Initialization
   Section 4: Hotkey & Search Autocomplete Effects
   Section 5: Handlers for Search, Submissions, & Recommendations
   Section 6: JSX Render Tree (Command Dock, Search, Add, Activities, Profiles)
   ========================================================================== */

/* ==========================================================================
   Section 1: Imports & Lazy Panels
   ========================================================================== */

import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CornerDownLeft, SlidersHorizontal, X } from "lucide-react";
import { burstConfetti } from "@/components/movies/settingsFun";
import { AccountPinViewport, TopFramePanel, TopFrameViewport, useTopFrame } from "@/app/TopFramePanels";
import {
  collapseAllNotches,
  useExclusiveNotch,
  useNotchGripDrag,
  useNotchMagneticPhysics,
} from "@/app/dynamicNotch";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { Button, ProfileMenu } from "@/components/ui";
import { concurrentMap } from "@/utils/concurrency";
import { PlusIcon } from "@/common/Icons";
import { NavbarToastViewport, useUser, useToast } from "@/app/providerContexts";
import { useProfileSelection } from "@/app/ProfilePinContext";
import { useMovies } from "@/hooks/movies";
import { useSuggestions } from "@/hooks/suggestions";
import {
  searchMovieAutocomplete,
  getCachedMovieAutocomplete,
  fetchOmdbMetadataCached,
} from "@/services/metadata";
import type { MovieAutocompleteResult } from "@/services/metadata";
import {
  MOVIE_AUTOCOMPLETE_DEBOUNCE_MS,
  MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from "@/components/movies";

import { MovieRecommendationComposer } from "@/components/movies";
import {
  WorkspaceSearchActions,
  WorkspaceAutocompleteCopy,
  WorkspaceAutocompleteGroup,
  WorkspaceAutocompleteLoading,
  WorkspaceAutocompleteOption,
  WorkspaceAutocompletePanel,
  WorkspaceAutocompletePoster,
  WorkspaceAutocompleteStatus,
} from "@/components/ui";
import {
  useAutocompleteFocusBoundary,
  useWorkspaceAutocompleteDismiss,
  useWorkspaceAutocompleteNavigation,
  useWorkspaceSearchInputHandle,
} from "@/components/ui/lib/workspaceListAutocomplete";
import {
  buildLibraryAutocompleteRows,
  libraryAutocompleteGroupLabel,
  librarySubmitLabel,
  normalizeLibraryQuery,
  resolveLibrarySubmitKind,
  type LibraryAutocompleteRow,
  type LibrarySelection,
  type LibrarySubmitKind,
} from "./lib";

const MoviePickerPanel = lazyWithRetry(() => import("@/components/spin-wheel/SpinWheelGame"));
const MessageBoardPanel = lazyWithRetry(() =>
  import("@/components/messages").then((m) => ({ default: m.MessageBoard })),
);

/* ==========================================================================
   Section 2: Component Interfaces & Types
   ========================================================================== */

export interface LibrarySearchHandle {
  focusSearchInput: () => void;
  focusAddInput: () => void;
}

export interface LibrarySearchProps {
  /** Renders the bottom-left Settings menu; receives the view, picker, and sound controls. */
  renderFilterSlot?: (settings: React.ReactNode) => React.ReactNode;
  viewSlot?: React.ReactNode;
  soundSlot?: React.ReactNode;
  badgeSlot?: React.ReactNode;
  dimSlot?: React.ReactNode;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  /** Titles left on the wall after the search, shown inside the expanded Search notch. */
  searchResultCount?: number;
  libraryCount?: number;
  onOpenMovie: (movieId: string) => void;
}

/* ==========================================================================
   Section 3: Component Setup & State Initialization
   ========================================================================== */

const LibrarySearch = React.forwardRef<LibrarySearchHandle, LibrarySearchProps>(
  (
    {
      renderFilterSlot,
      viewSlot,
      soundSlot,
      badgeSlot,
      dimSlot,
      searchQuery,
      onSearchQueryChange,
      onOpenMovie,
      searchResultCount,
      libraryCount,
    },
    forwardedRef,
  ) => {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const { modalOpen } = useTopFrame();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [messagesOpen, setMessagesOpen] = useState(false);
    const pickerTriggerRef = useRef<HTMLButtonElement>(null);
    const messagesTriggerRef = useRef<HTMLButtonElement>(null);

    const closePicker = useCallback(() => {
      setPickerOpen(false);
      window.requestAnimationFrame(() => {
        const trigger = pickerTriggerRef.current?.isConnected
          ? pickerTriggerRef.current
          : document.querySelector<HTMLElement>(".y2k-command-dock .movie-wall-filters__trigger");
        trigger?.focus();
      });
    }, []);

    const closeMessages = useCallback(() => {
      setMessagesOpen(false);
      window.requestAnimationFrame(() => {
        const trigger = messagesTriggerRef.current?.isConnected
          ? messagesTriggerRef.current
          : document.querySelector<HTMLElement>(".y2k-command-dock .movie-wall-filters__trigger");
        trigger?.focus();
      });
    }, []);

    useEffect(() => {
      if ((!pickerOpen && !messagesOpen) || modalOpen) return;
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          if (pickerOpen) closePicker();
          if (messagesOpen) closeMessages();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [pickerOpen, messagesOpen, modalOpen, closePicker, closeMessages]);

    useEffect(() => {
      const handleOpenMessages = () => {
        setPickerOpen(false);
        setMessagesOpen(true);
      };
      const handleToggleMessages = () => {
        setPickerOpen(false);
        setMessagesOpen((open) => !open);
      };
      window.addEventListener("open-chat-experience", handleOpenMessages);
      window.addEventListener("open-messages-experience", handleOpenMessages);
      window.addEventListener("toggle-chat-panel", handleToggleMessages);
      return () => {
        window.removeEventListener("open-chat-experience", handleOpenMessages);
        window.removeEventListener("open-messages-experience", handleOpenMessages);
        window.removeEventListener("toggle-chat-panel", handleToggleMessages);
      };
    }, []);

    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isSearchPinnedCollapsed, setIsSearchPinnedCollapsed] = useState(false);
    const [isAddExpanded, setIsAddExpanded] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTriggerRef = useRef<HTMLButtonElement>(null);
    const addTriggerRef = useRef<HTMLButtonElement>(null);
    const searchHostRef = useRef<HTMLDivElement>(null);
    const addHostRef = useRef<HTMLFormElement>(null);
    const settingsHostRef = useRef<HTMLDivElement>(null);
    const activitiesHostRef = useRef<HTMLDivElement>(null);
    const profilesHostRef = useRef<HTMLDivElement>(null);

    const searchInputId = useId();
    const addInputId = useId();
    const searchExpanded =
      isSearchExpanded ||
      (Boolean(searchQuery) && !isAddExpanded && !isSearchPinnedCollapsed);

    useNotchMagneticPhysics(searchHostRef);
    useNotchMagneticPhysics(addHostRef);
    useNotchMagneticPhysics(settingsHostRef);
    useNotchMagneticPhysics(activitiesHostRef);
    useNotchMagneticPhysics(profilesHostRef);

    const { currentUser } = useUser();
    const { showToast } = useToast();
    const { movies, addMovie, deleteMovie } = useMovies(currentUser);
    const { addSuggestion } = useSuggestions();

    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRegionRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const dropdownInteractionPendingRef = useRef(false);
    const listId = useId();

    const revealLibraryItem = useCallback(
      (item: LibrarySelection) => {
        if (item?.kind === "library-movie") onOpenMovie(item.movieId);
      },
      [onOpenMovie],
    );

    const [catalogRatings, setCatalogRatings] = useState<Record<string, string>>({});
    const [selection, setSelection] = useState<LibrarySelection>(null);
    const [movieResults, setMovieResults] = useState<MovieAutocompleteResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);
    const [showRecommend, setShowRecommend] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [recommendReason, setRecommendReason] = useState("");

    const {
      activeIndex,
      setActiveIndex,
      resetActiveIndex,
      moveActiveIndex,
      getEnterSelectionIndex,
    } = useWorkspaceAutocompleteNavigation();

    const trimmed = query.trim();
    const normalized = normalizeLibraryQuery(query);
    const isGuest = !currentUser;

    const rows = useMemo(
      () =>
        buildLibraryAutocompleteRows({
          query: trimmed,
          movies,
          places: [],
          movieResults,
        }).filter(
          (row) =>
            row.selection?.kind !== "place-draft" &&
            row.selection?.kind !== "library-place",
        ),
      [movieResults, movies, trimmed],
    );

    const rawSubmitKind = resolveLibrarySubmitKind({
      query: trimmed,
      selection,
      movieResultCount: movieResults.length,
    });
    const submitKind: LibrarySubmitKind =
      rawSubmitKind === "place" || rawSubmitKind === "show-place"
        ? "movie"
        : rawSubmitKind;
    const primaryLabel = librarySubmitLabel(submitKind, isGuest);
    const hasQuery = trimmed.length > 0;
    const addExpanded = isAddExpanded || (Boolean(query) && !isSearchExpanded) || isBusy;

    /* Exclusive notch expansion controller */
    useExclusiveNotch("search", isSearchExpanded, () => {
      setIsSearchExpanded(false);
      if (searchQuery) setIsSearchPinnedCollapsed(true);
    });
    useExclusiveNotch("add", isAddExpanded || isOpen, () => {
      setIsOpen(false);
      setIsMounted(false);
      setIsAddExpanded(false);
    });
    useExclusiveNotch("activities", pickerOpen, () => setPickerOpen(false));
    useExclusiveNotch("activities", messagesOpen, () => setMessagesOpen(false));

    useEffect(() => {
      if (currentUser) return;
      setShowRecommend(false);
      setGuestName("");
      setRecommendReason("");
    }, [currentUser]);

    const hideAutocomplete = useCallback(() => {
      setIsOpen(false);
      resetActiveIndex();
      setIsMounted(false);
      setIsLoading(false);
    }, [resetActiveIndex]);

    const { onFocusCapture, onBlurCapture, clearFocusBoundaryCheck } =
      useAutocompleteFocusBoundary(autocompleteRegionRef, hideAutocomplete, {
        shouldSkipClose: () => dropdownInteractionPendingRef.current,
      });

    const { requestLogin, currentUser: profileUser } = useProfileSelection();
    const focusAddInputHandle = useWorkspaceSearchInputHandle(inputRef);

    const focusAddInput = useCallback(() => {
      if (!currentUser) {
        requestLogin();
        return;
      }
      setIsSearchExpanded(false);
      setIsAddExpanded(true);
      window.requestAnimationFrame(focusAddInputHandle);
    }, [currentUser, focusAddInputHandle, requestLogin]);

    const focusSearchInput = useCallback(() => {
      setIsAddExpanded(false);
      setIsSearchPinnedCollapsed(false);
      setIsSearchExpanded(true);
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });
    }, []);

    const collapseSearchNotch = useCallback(() => {
      setIsSearchExpanded(false);
      if (searchQuery) setIsSearchPinnedCollapsed(true);
    }, [searchQuery]);

    const collapseAddNotch = useCallback(() => {
      hideAutocomplete();
      setIsAddExpanded(false);
    }, [hideAutocomplete]);

    const searchGrip = useNotchGripDrag({
      edge: "top",
      isOpen: searchExpanded,
      onOpen: focusSearchInput,
      onClose: collapseSearchNotch,
      hostRef: searchHostRef,
    });

    const addGrip = useNotchGripDrag({
      edge: "top",
      isOpen: addExpanded,
      onOpen: focusAddInput,
      onClose: collapseAddNotch,
      hostRef: addHostRef,
    });

    const settingsGrip = useNotchGripDrag({
      edge: "bottom",
      isOpen: false,
      onOpen: () => window.dispatchEvent(new CustomEvent("dynamic-notch:toggle-settings")),
      onClose: () => window.dispatchEvent(new CustomEvent("dynamic-notch:toggle-settings")),
      hostRef: settingsHostRef,
    });

    const activitiesGrip = useNotchGripDrag({
      edge: "top",
      isOpen: pickerOpen || messagesOpen,
      onOpen: () => {
        setMessagesOpen(false);
        setPickerOpen(true);
      },
      onClose: () => {
        setPickerOpen(false);
        setMessagesOpen(false);
      },
      hostRef: activitiesHostRef,
    });

    const profilesGrip = useNotchGripDrag({
      edge: "bottom",
      isOpen: false,
      onOpen: () => {
        if (profileUser) {
          const btn = document.querySelector<HTMLButtonElement>(
            `.profile-switcher-btn--${profileUser.toLowerCase()}`,
          );
          btn?.click();
        } else {
          requestLogin();
        }
      },
      onClose: collapseAllNotches,
      hostRef: profilesHostRef,
    });

    useImperativeHandle(forwardedRef, () => ({ focusSearchInput, focusAddInput }), [
      focusSearchInput,
      focusAddInput,
    ]);

    useWorkspaceAutocompleteDismiss(autocompleteRegionRef, () => {
      setIsFocused(false);
      if (!query && !isBusy) setIsAddExpanded(false);
      hideAutocomplete();
    });

    /* ==========================================================================
       Section 4: Hotkey & Search Autocomplete Effects
       ========================================================================== */

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.isComposing || modalOpen) return;
        const target = event.target instanceof Element ? event.target : null;
        const editing = Boolean(
          target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'),
        );
        if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          focusAddInput();
        } else if (event.key === "/" && !editing && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault();
          focusSearchInput();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [focusSearchInput, focusAddInput, modalOpen]);

    useEffect(() => {
      if (!isFocused) {
        hideAutocomplete();
        return;
      }
      if (
        selection?.kind === "movie-result" &&
        normalizeLibraryQuery(selection.title) === normalized
      ) {
        requestIdRef.current += 1;
        setIsOpen(false);
        setIsLoading(false);
        return;
      }
      if (normalized.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
        requestIdRef.current += 1;
        setMovieResults([]);
        setFetchError(null);
        setIsLoading(false);
        return;
      }

      const abortController = new AbortController();
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsMounted(true);
      setIsOpen(true);

      const cachedResults = getCachedMovieAutocomplete(trimmed);
      if (cachedResults) {
        setMovieResults(cachedResults);
        setIsLoading(false);
        setFetchError(null);
      } else {
        setIsLoading(true);
        setFetchError(null);
      }

      const timeoutId = window.setTimeout(async () => {
        try {
          const nextResults = await searchMovieAutocomplete(trimmed, {
            signal: abortController.signal,
          });
          if (
            requestIdRef.current !== requestId ||
            abortController.signal.aborted
          ) {
            return;
          }
          setMovieResults(nextResults);
          resetActiveIndex();
        } catch (error) {
          if (
            requestIdRef.current !== requestId ||
            abortController.signal.aborted
          ) {
            return;
          }
          if (!cachedResults) {
            setMovieResults([]);
            setFetchError(
              error instanceof Error && error.message
                ? error.message
                : "Suggestions are unavailable right now.",
            );
          }
        } finally {
          if (
            requestIdRef.current === requestId &&
            !abortController.signal.aborted
          ) {
            setIsLoading(false);
          }
        }
      }, MOVIE_AUTOCOMPLETE_DEBOUNCE_MS);

      return () => {
        window.clearTimeout(timeoutId);
        abortController.abort();
      };
    }, [
      hideAutocomplete,
      isFocused,
      normalized,
      resetActiveIndex,
      selection,
      trimmed,
    ]);

    useEffect(() => {
      if (
        trimmed.length >= 2 &&
        isFocused &&
        !(
          selection?.kind === "movie-result" &&
          normalizeLibraryQuery(selection.title) === normalized
        )
      ) {
        setIsMounted(true);
        setIsOpen(true);
      }
    }, [isFocused, normalized, selection, trimmed.length]);

    /* Enrich visible results with IMDb ratings asynchronously */
    useEffect(() => {
      if (!isFocused || !isOpen || isLoading) return;
      const controller = new AbortController();
      void concurrentMap(movieResults.slice(0, 6), 2, async (result) => {
        if (!result.imdbID || controller.signal.aborted) return;
        try {
          const metadata = await fetchOmdbMetadataCached(
            result.title,
            result.type,
            result.imdbID,
            controller.signal,
          );
          if (!controller.signal.aborted && metadata.imdbRating && metadata.imdbRating !== "N/A") {
            setCatalogRatings((ratings) => ({
              ...ratings,
              [result.imdbID!]: metadata.imdbRating!,
            }));
          }
        } catch {
          // Non-blocking rating fallback
        }
      });
      return () => controller.abort();
    }, [isFocused, isOpen, isLoading, movieResults]);

    /* ==========================================================================
       Section 5: Handlers for Search, Submissions, & Recommendations
       ========================================================================== */

    const clearQuery = useCallback(() => {
      setQuery("");
      setSelection(null);
      setMovieResults([]);
      setActionError(null);
      setShowRecommend(false);
      hideAutocomplete();
    }, [hideAutocomplete]);

    const saveMovieEntry = useCallback(
      async (
        movieTitle: string,
        movieMeta?: { imdbID?: string; type?: string },
      ) => {
        const cleanTitle = movieTitle.trim();
        if (isBusy || !cleanTitle) return;

        setIsBusy(true);
        setActionError(null);
        hideAutocomplete();

        try {
          if (isGuest) {
            const suggestion = await addSuggestion(
              cleanTitle,
              undefined,
              guestName.trim() || undefined,
              movieMeta,
            );
            showToast({
              message: `"${cleanTitle}" sent to movie suggestions as ${suggestion.suggestedBy}.`,
              type: "success",
            });
          } else {
            const added = await addMovie(cleanTitle, movieMeta);
            showToast({
              message: `"${cleanTitle}" added to movies!`,
              type: "success",
              actionLabel: "Undo",
              onAction: () => void deleteMovie(added.id),
            });
          }
          clearQuery();
          setIsAddExpanded(true);
          setIsFocused(true);
          window.requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not save that right now.";
          setActionError(message);
          showToast({ message, type: "error" });
        } finally {
          setIsBusy(false);
        }
      },
      [
        addMovie,
        addSuggestion,
        clearQuery,
        deleteMovie,
        guestName,
        hideAutocomplete,
        isBusy,
        isGuest,
        showToast,
      ],
    );

    const selectRow = useCallback(
      async (row: LibraryAutocompleteRow) => {
        if (row.selection?.kind === "library-movie") {
          revealLibraryItem(row.selection);
          hideAutocomplete();
          clearQuery();
          return;
        }
        if (row.selection?.kind === "movie-result") {
          await saveMovieEntry(row.selection.title, {
            imdbID: row.selection.imdbID,
            type: row.selection.type,
          });
          return;
        }
        if (row.selection?.kind === "movie-draft") {
          await saveMovieEntry(row.selection.title || row.title);
          return;
        }

        setSelection(row.selection);
        setQuery(row.title);
        hideAutocomplete();
        inputRef.current?.focus();
      },
      [clearQuery, hideAutocomplete, revealLibraryItem, saveMovieEntry],
    );

    const submitKindAction = useCallback(
      async (kind: LibrarySubmitKind) => {
        if (isBusy || !trimmed) return;

        if (kind === "show-movie" || kind === "show-place") {
          revealLibraryItem(selection);
          hideAutocomplete();
          return;
        }

        const movieTitle =
          selection?.kind === "movie-result" ? selection.title : trimmed;
        const movieMeta =
          selection?.kind === "movie-result"
            ? { imdbID: selection.imdbID, type: selection.type }
            : undefined;

        await saveMovieEntry(movieTitle, movieMeta);
      },
      [
        hideAutocomplete,
        isBusy,
        revealLibraryItem,
        saveMovieEntry,
        selection,
        trimmed,
      ],
    );

    const handlePrimary = useCallback(() => {
      void submitKindAction(submitKind);
    }, [submitKind, submitKindAction]);

    const handleRecommend = useCallback(async () => {
      if (isBusy || !trimmed) return;

      setIsBusy(true);
      setActionError(null);

      try {
        const movieTitle =
          selection?.kind === "movie-result" ? selection.title : trimmed;
        const movieMeta =
          selection?.kind === "movie-result"
            ? { imdbID: selection.imdbID, type: selection.type }
            : undefined;

        const suggestion = await addSuggestion(
          movieTitle,
          recommendReason,
          guestName.trim() || undefined,
          movieMeta,
        );
        showToast({
          message: `"${movieTitle}" recommended as ${suggestion.suggestedBy}.`,
          type: "success",
        });
        setShowRecommend(false);
        setRecommendReason("");
        clearQuery();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not send that recommendation.";
        setActionError(message);
      } finally {
        setIsBusy(false);
      }
    }, [
      addSuggestion,
      clearQuery,
      guestName,
      isBusy,
      recommendReason,
      selection,
      showToast,
      trimmed,
    ]);

    const groupedRows = useMemo(() => {
      const groups: Array<{
        group: LibraryAutocompleteRow["group"];
        rows: LibraryAutocompleteRow[];
      }> = [];
      for (const row of rows) {
        const last = groups[groups.length - 1];
        if (last?.group === row.group) {
          last.rows.push(row);
        } else {
          groups.push({ group: row.group, rows: [row] });
        }
      }
      return groups;
    }, [rows]);

    const showPanel =
      isMounted &&
      (isLoading ||
        rows.length > 0 ||
        Boolean(fetchError) ||
        trimmed.length >= 2);

    /* ==========================================================================
       Section 6: JSX Render Tree
       ========================================================================== */

    const commandDock = (
      <div
        className="workspace-search__stage curved-library-search y2k-command-dock"
        data-panel-origin={pickerOpen ? "picker" : messagesOpen ? "messages" : isOpen ? "add" : "filters"}
        role="navigation"
        aria-label="Movie controls"
      >
        <div
          ref={autocompleteRegionRef}
          className={`curved-library-search__boundary y2k-command-dock__boundary${showPanel && isOpen ? " is-autocomplete-active" : ""}${isFocused ? " is-focused" : ""}`}
          onFocusCapture={onFocusCapture}
          onBlurCapture={onBlurCapture}
        >
          <div className="y2k-command-dock__bar" inert={modalOpen}>
            {/* Top-Left Notch: Search */}
            <div
              ref={searchHostRef}
              className={`y2k-library-search y2k-symbol-control${searchExpanded ? " is-expanded" : ""}${searchQuery && !searchExpanded ? " has-active-query" : ""}`}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget) && !searchQuery) {
                  setIsSearchExpanded(false);
                }
              }}
            >
              <span className="dyn-notch" data-notch="search" aria-hidden="true">
                <i className="dyn-notch__grip" {...searchGrip} />
              </span>
              <button
                ref={searchTriggerRef}
                type="button"
                className="y2k-symbol-control__trigger y2k-symbol-control__trigger--artwork"
                aria-label="Search movies (/)"
                title="Search watchlist (/)"
                aria-expanded={searchExpanded}
                aria-controls={searchInputId}
                onClick={focusSearchInput}
              >
                <svg className="frame-command-art" viewBox="0 145 865 550" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <image href="/avatars/search_aaron_electra_pixel_icon.png" width="865" height="865" />
                </svg>
                <span className="frame-command-label" aria-hidden="true">Search</span>
              </button>

              {searchQuery && !searchExpanded ? (
                <span className="dyn-notch-status-badge" aria-live="polite">
                  <button
                    type="button"
                    className="dyn-notch-status-badge__text"
                    onClick={focusSearchInput}
                    title={`Filtering by "${searchQuery}" — click to edit`}
                  >
                    &ldquo;{searchQuery}&rdquo;
                    {searchResultCount !== undefined ? ` · ${searchResultCount}` : ""}
                  </button>
                  <button
                    type="button"
                    className="dyn-notch-status-badge__clear"
                    aria-label="Clear active search filter"
                    title="Clear search filter"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSearchQueryChange("");
                      setIsSearchPinnedCollapsed(false);
                    }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ) : null}

              <div className="y2k-symbol-control__field" hidden={!searchExpanded}>
                <input
                  id={searchInputId}
                  ref={searchInputRef}
                  type="search"
                  className="y2k-search-capsule__input"
                  value={searchQuery}
                  onChange={(event) => {
                    setIsSearchPinnedCollapsed(false);
                    onSearchQueryChange(event.target.value);
                  }}
                  placeholder="Search movies..."
                  aria-label="Search your watchlist"
                  autoComplete="off"
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) return;
                    if (event.key === "Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      onSearchQueryChange("");
                      setIsSearchPinnedCollapsed(false);
                      setIsSearchExpanded(false);
                      searchTriggerRef.current?.focus();
                    }
                  }}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    className="y2k-search-capsule__clear"
                    aria-label="Clear watchlist search"
                    onClick={() => {
                      onSearchQueryChange("");
                      setIsSearchPinnedCollapsed(false);
                      searchInputRef.current?.focus();
                    }}
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd className="y2k-search-capsule__kbd" aria-hidden="true">/</kbd>
                )}
              </div>

              {searchExpanded ? (
                <p className="dyn-notch-hint" aria-live="polite">
                  {searchQuery && searchResultCount !== undefined ? (
                    <span>
                      <strong>{searchResultCount}</strong> of {libraryCount ?? searchResultCount}{" "}
                      {(libraryCount ?? searchResultCount) === 1 ? "title" : "titles"} match
                    </span>
                  ) : (
                    <span>Filters the wall as you type</span>
                  )}
                  <span className="dyn-notch-hint__keys" aria-hidden="true">Esc closes</span>
                </p>
              ) : null}
            </div>

            {/* Top-Right Notch: Add Movie/Show */}
            <form
              ref={addHostRef}
              className={`y2k-search-form y2k-add-form y2k-symbol-control${addExpanded ? " is-expanded" : ""}`}
              onBlur={(event) => {
                if (
                  !event.currentTarget.contains(event.relatedTarget) &&
                  !dropdownInteractionPendingRef.current
                ) {
                  setIsFocused(false);
                  if (!query && !isBusy) setIsAddExpanded(false);
                }
              }}
              onSubmit={(event) => {
                event.preventDefault();
                if (isBusy || !hasQuery) return;
                clearFocusBoundaryCheck();
                hideAutocomplete();
                handlePrimary();
              }}
            >
              <span className="dyn-notch" data-notch="add" aria-hidden="true">
                <i className="dyn-notch__grip" {...addGrip} />
              </span>
              <div
                className={`y2k-search-capsule${isFocused ? " is-focused" : ""}${isLoading || isBusy ? " is-loading" : ""}`}
              >
                <button
                  ref={addTriggerRef}
                  type="button"
                  className="y2k-symbol-control__trigger y2k-symbol-control__trigger--artwork"
                  aria-label="Add a movie or show (Cmd+K)"
                  title="Add a movie or show (Cmd/Ctrl+K)"
                  aria-expanded={addExpanded}
                  aria-controls={addInputId}
                  onClick={focusAddInput}
                >
                  <svg className="frame-command-art" viewBox="0 145 823 540" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <image href="/avatars/add_aaron_electra_pixel_icon.png" width="823" height="823" />
                  </svg>
                  <span className="frame-command-label" aria-hidden="true">{isBusy ? "Saving…" : "Add"}</span>
                </button>
                <div className="y2k-symbol-control__field" hidden={!addExpanded}>
                  <input
                    id={addInputId}
                    ref={inputRef}
                    type="text"
                    className="y2k-search-capsule__input"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelection(null);
                      setActionError(null);
                      setShowRecommend(false);
                    }}
                    placeholder="Add a movie or show..."
                    aria-label="Search movies and shows to add"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    aria-activedescendant={
                      isOpen && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
                    }
                    aria-autocomplete="list"
                    autoComplete="off"
                    spellCheck={false}
                    onFocus={() => {
                      setIsFocused(true);
                      if (
                        trimmed.length >= 2 &&
                        !(
                          selection?.kind === "movie-result" &&
                          normalizeLibraryQuery(selection.title) === normalized
                        )
                      ) {
                        setIsMounted(true);
                        setIsOpen(true);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.nativeEvent.isComposing) return;
                      if (event.key === "ArrowDown") {
                        if (rows.length === 0) return;
                        event.preventDefault();
                        setIsOpen(true);
                        moveActiveIndex("next", rows.length);
                        return;
                      }
                      if (event.key === "ArrowUp") {
                        if (rows.length === 0) return;
                        event.preventDefault();
                        setIsOpen(true);
                        moveActiveIndex("previous", rows.length);
                        return;
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        hideAutocomplete();
                        clearQuery();
                        setIsAddExpanded(false);
                        addTriggerRef.current?.focus();
                        event.stopPropagation();
                        return;
                      }
                      if (event.key === "Enter" && isOpen) {
                        const selectedIndex = getEnterSelectionIndex(rows.length);
                        if (selectedIndex >= 0 && rows[selectedIndex]) {
                          event.preventDefault();
                          selectRow(rows[selectedIndex]);
                        }
                      }
                    }}
                  />

                  {hasQuery ? (
                    <button
                      type="button"
                      className="y2k-search-capsule__clear"
                      onClick={(event) => {
                        event.stopPropagation();
                        clearQuery();
                        window.requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                      aria-label="Clear title to add"
                      title="Clear title"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <kbd className="y2k-search-capsule__kbd" aria-hidden="true" title="Press Cmd/Ctrl+K to add">
                      ⌘K
                    </kbd>
                  )}

                  {hasQuery || isBusy ? (
                    <button
                      type="submit"
                      className="y2k-search-capsule__submit is-ready"
                      disabled={isBusy || !hasQuery}
                    >
                      <span>{isBusy ? "Saving…" : primaryLabel}</span>
                      <CornerDownLeft size={13} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>

              {addExpanded && !(showPanel && isOpen) ? (
                <p className="dyn-notch-hint">
                  <span>{hasQuery ? "Enter adds it to the wall" : "Type a movie or show"}</span>
                  <span className="dyn-notch-hint__keys" aria-hidden="true">Esc closes</span>
                </p>
              ) : null}
            </form>

            {renderFilterSlot ? (
              <>
                <div className="y2k-command-dock__divider" aria-hidden="true" />

                {/* Bottom-Left Notch: Settings & Filter Controls */}
                <div
                  ref={settingsHostRef}
                  className="y2k-command-dock__filters"
                  onPointerDown={(event) => {
                    if (isOpen) hideAutocomplete();
                    if (
                      (pickerOpen || messagesOpen) &&
                      (event.target as Element | null)?.closest(".movie-wall-filters__trigger")
                    ) {
                      setPickerOpen(false);
                      setMessagesOpen(false);
                    }
                  }}
                >
                  <span className="dyn-notch" data-notch="settings" aria-hidden="true">
                    <i className="dyn-notch__grip" {...settingsGrip} />
                  </span>
                  {renderFilterSlot(
                    <div className="settings-menu__switches">
                      {viewSlot}
                      {soundSlot}
                      {badgeSlot}
                      {dimSlot}
                    </div>,
                  )}
                </div>

                {/* Top-Center Notch: Activities & Messages */}
                <div
                  ref={activitiesHostRef}
                  className={`y2k-command-dock__activities${pickerOpen || messagesOpen ? " is-expanded" : ""}`}
                  role="region"
                  aria-label="Activities and messages"
                >
                  <span className="dyn-notch" data-notch="activities" aria-hidden="true">
                    <i className="dyn-notch__grip" {...activitiesGrip} />
                  </span>
                  <button
                    ref={pickerTriggerRef}
                    type="button"
                    className="frame-picker-trigger"
                    data-closes-settings
                    aria-label="Pick a movie"
                    aria-expanded={pickerOpen}
                    aria-controls="top-frame-movie-picker"
                    onClick={(event) => {
                      if (!pickerOpen) burstConfetti(event.currentTarget);
                      setMessagesOpen(false);
                      setPickerOpen((open) => !open);
                    }}
                  >
                    <svg className="frame-picker-art" viewBox="300 185 1170 465" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                      <image href="/avatars/pick-a-movie-pixel-button.png" width="1773" height="887" />
                    </svg>
                    <span>Pick a movie</span>
                  </button>

                  <button
                    ref={messagesTriggerRef}
                    type="button"
                    className="frame-messages-trigger"
                    data-closes-settings
                    aria-label="Messages"
                    aria-expanded={messagesOpen}
                    aria-controls="top-frame-messages"
                    onClick={() => {
                      setPickerOpen(false);
                      setMessagesOpen((open) => !open);
                    }}
                  >
                    <img
                      className="frame-messages-art"
                      src="/avatars/pixel-orbit-speech-bubble.png"
                      alt=""
                      aria-hidden="true"
                      width={256}
                      height={256}
                      draggable={false}
                      decoding="async"
                    />
                    <span>Messages</span>
                  </button>

                  {currentUser ? (
                    <button
                      type="button"
                      className="frame-quiz-trigger"
                      data-closes-settings
                      aria-label="Movie quiz"
                      aria-haspopup="dialog"
                      title="Which movie character are you?"
                      onClick={() => {
                        setPickerOpen(false);
                        setMessagesOpen(false);
                        window.dispatchEvent(new CustomEvent("open-quiz-experience"));
                      }}
                    >
                      <img
                        className="frame-quiz-art"
                        src="/movie-quiz-cover.svg"
                        alt=""
                        aria-hidden="true"
                        width={400}
                        height={600}
                        draggable={false}
                      />
                      <span>Movie quiz</span>
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}

            <NavbarToastViewport />
          </div>

          <TopFrameViewport />

          {/* Expanded Top Frame Panels */}
          {pickerOpen ? (
            <TopFramePanel name="picker">
              <section id="top-frame-movie-picker" className="frame-movie-picker" data-notch-panel="activities" role="dialog" aria-label="Movie picker">
                <div className="frame-panel-heading">
                  <h2>Pick a movie</h2>
                  <div className="frame-panel-heading__actions">
                    <button
                      type="button"
                      className="frame-panel-heading__switch"
                      onClick={() => {
                        setPickerOpen(false);
                        window.setTimeout(() => {
                          window.dispatchEvent(new CustomEvent("dynamic-notch:open-settings"));
                        }, 0);
                      }}
                      aria-label="Switch to Settings"
                      title="Switch back to Settings"
                    >
                      <SlidersHorizontal size={14} aria-hidden="true" />
                      <span>Settings</span>
                    </button>
                    <button type="button" onClick={closePicker} aria-label="Close movie picker">
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <React.Suspense fallback={<p role="status">Loading movie picker…</p>}>
                  <MoviePickerPanel />
                </React.Suspense>
              </section>
            </TopFramePanel>
          ) : null}

          {messagesOpen ? (
            <TopFramePanel name="messages">
              <section id="top-frame-messages" className="frame-messages-panel" data-notch-panel="activities" role="dialog" aria-label="Messages">
                <div className="frame-panel-heading">
                  <h2>Messages</h2>
                  <div className="frame-panel-heading__actions">
                    <button
                      type="button"
                      className="frame-panel-heading__switch"
                      onClick={() => {
                        setMessagesOpen(false);
                        window.setTimeout(() => {
                          window.dispatchEvent(new CustomEvent("dynamic-notch:open-settings"));
                        }, 0);
                      }}
                      aria-label="Switch to Settings"
                      title="Switch back to Settings"
                    >
                      <SlidersHorizontal size={14} aria-hidden="true" />
                      <span>Settings</span>
                    </button>
                    <button type="button" data-tv-close="" onClick={closeMessages} aria-label="Close messages">
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <React.Suspense fallback={<p role="status">Loading messages…</p>}>
                  <MessageBoardPanel />
                </React.Suspense>
              </section>
            </TopFramePanel>
          ) : null}

          {/* Subbar Selection & Recommendation Bar */}
          {selection?.kind === "movie-result" || (hasQuery && submitKind === "movie" && currentUser) ? (
            <div className="y2k-command-dock__subbar">
              {selection?.kind === "movie-result" ? (
                <div className="curved-library-search__selection" role="status" aria-live="polite">
                  <span>
                    <span aria-hidden="true">✓</span> Selected <strong>{selection.title}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelection(null);
                      window.requestAnimationFrame(() => {
                        inputRef.current?.focus();
                        inputRef.current?.select();
                      });
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : null}

              {hasQuery && submitKind === "movie" && currentUser ? (
                <WorkspaceSearchActions className="curved-library-search__secondary-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isBusy}
                    leftIcon={<PlusIcon />}
                    onClick={() => {
                      hideAutocomplete();
                      setShowRecommend(true);
                    }}
                  >
                    Recommend
                  </Button>
                </WorkspaceSearchActions>
              ) : null}
            </div>
          ) : null}

          {/* Autocomplete Dropdown Listbox */}
          {showPanel && isOpen ? (
            <TopFramePanel name="add">
              <WorkspaceAutocompletePanel
                id={listId}
                isOpen={isOpen}
                ariaLabel="Movie and show suggestions"
                onPointerDown={() => {
                  dropdownInteractionPendingRef.current = true;
                  window.setTimeout(() => {
                    dropdownInteractionPendingRef.current = false;
                  }, 300);
                }}
              >
                {isLoading ? <WorkspaceAutocompleteLoading /> : null}
                {fetchError ? (
                  <WorkspaceAutocompleteStatus role="alert">
                    {fetchError}
                  </WorkspaceAutocompleteStatus>
                ) : null}
                {!isLoading && rows.length === 0 && trimmed.length >= 2 ? (
                  <WorkspaceAutocompleteStatus>
                    No matches yet — press Enter to add this movie.
                  </WorkspaceAutocompleteStatus>
                ) : null}
                {!isLoading
                  ? groupedRows.map((group) => (
                      <React.Fragment key={group.group}>
                        <WorkspaceAutocompleteGroup>
                          {libraryAutocompleteGroupLabel(group.group)}
                        </WorkspaceAutocompleteGroup>
                        {group.rows.map((row) => {
                          const index = rows.indexOf(row);
                          return (
                            <WorkspaceAutocompleteOption
                              key={row.id}
                              id={`${listId}-option-${index}`}
                              isActive={index === activeIndex}
                              actionLabel={row.actionLabel}
                              onSelect={() => selectRow(row)}
                              onHover={() => setActiveIndex(index)}
                            >
                              {row.posterUrl || !row.icon ? (
                                <WorkspaceAutocompletePoster
                                  src={row.posterUrl}
                                  fallbackLetter={row.title.charAt(0).toUpperCase()}
                                />
                              ) : (
                                <span className="workspace-search__autocomplete-poster" aria-hidden>
                                  {row.icon}
                                </span>
                              )}
                              <WorkspaceAutocompleteCopy
                                title={row.title}
                                meta={
                                  row.selection.kind === "movie-result" &&
                                  row.selection.imdbID &&
                                  catalogRatings[row.selection.imdbID]
                                    ? `${row.meta} • IMDb ${catalogRatings[row.selection.imdbID]}`
                                    : row.meta
                                }
                              />
                            </WorkspaceAutocompleteOption>
                          );
                        })}
                      </React.Fragment>
                    ))
                  : null}
              </WorkspaceAutocompletePanel>
            </TopFramePanel>
          ) : null}
        </div>

        {actionError ? (
          <div className="workspace-search__error" role="alert">
            <span className="workspace-search__error-dot" aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        ) : null}
      </div>
    );

    return (
      <>
        {typeof document !== "undefined"
          ? createPortal(
              <>
                <div className="dyn-notch-scrim" aria-hidden="true" onClick={collapseAllNotches} />
                {commandDock}
                <div
                  ref={profilesHostRef}
                  className="frame-corner-profiles y2k-command-dock__profiles"
                  role="region"
                  aria-label="Account controls"
                  inert={modalOpen}
                >
                  <span className="dyn-notch" data-notch="profiles" aria-hidden="true">
                    <i className="dyn-notch__grip" {...profilesGrip} />
                  </span>
                  <ProfileMenu />
                </div>
                <AccountPinViewport />
              </>,
              document.body,
            )
          : commandDock}

        {showRecommend && currentUser && hasQuery ? (
          <MovieRecommendationComposer
            currentUser={currentUser}
            movieTitle={selection?.kind === "movie-result" ? selection.title : trimmed}
            guestName={guestName}
            reason={recommendReason}
            error={actionError}
            isSubmitting={isBusy}
            onGuestNameChange={setGuestName}
            onReasonChange={setRecommendReason}
            onSubmit={handleRecommend}
            onCancel={() => {
              setShowRecommend(false);
              setRecommendReason("");
            }}
          />
        ) : null}
      </>
    );
  },
);

LibrarySearch.displayName = "LibrarySearch";

export default LibrarySearch;
