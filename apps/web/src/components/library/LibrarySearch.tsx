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
import { AccountPinViewport, TopFramePanel, TopFrameViewport, useTopFrame } from "@/app/TopFramePanels";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { CornerDownLeft, X } from "lucide-react";
import { Button, ProfileMenu } from "@/components/ui";
import { concurrentMap } from "@/utils/concurrency";
import { PlusIcon } from "@/common/Icons";
import { NavbarToastViewport, useUser, useToast } from "@/app/providerContexts";
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
import { WorkspaceSearchActions } from "@/components/ui";
import {
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

export interface LibrarySearchHandle {
  focusSearchInput: () => void;
  focusAddInput: () => void;
}

export interface LibrarySearchProps {
  filterSlot?: React.ReactNode;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOpenMovie: (movieId: string) => void;
}

const LibrarySearch = React.forwardRef<LibrarySearchHandle, LibrarySearchProps>(
  ({ filterSlot, searchQuery, onSearchQueryChange, onOpenMovie }, forwardedRef) => {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const { modalOpen } = useTopFrame();
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerTriggerRef = useRef<HTMLButtonElement>(null);
    const closePicker = useCallback(() => {
      setPickerOpen(false);
      window.requestAnimationFrame(() => pickerTriggerRef.current?.focus());
    }, []);
    useEffect(() => {
      if (!pickerOpen || modalOpen) return;
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          closePicker();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [pickerOpen, modalOpen, closePicker]);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isAddExpanded, setIsAddExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTriggerRef = useRef<HTMLButtonElement>(null);
    const addTriggerRef = useRef<HTMLButtonElement>(null);
    const searchInputId = useId();
    const addInputId = useId();
    const searchExpanded = isSearchExpanded || Boolean(searchQuery);


    const { currentUser } = useUser();
    const { showToast } = useToast();
    const { movies, addMovie, deleteMovie } = useMovies(currentUser);
    const { addSuggestion } = useSuggestions();

    const inputRef = useRef<HTMLInputElement>(null);
    const navbarRef = useRef<HTMLDivElement>(null);
    const autocompleteRegionRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const dropdownInteractionPendingRef = useRef(false);
    const listId = useId();

    const revealLibraryItem = useCallback((item: LibrarySelection) => {
      if (item?.kind === "library-movie") onOpenMovie(item.movieId);
    }, [onOpenMovie]);
    const [catalogRatings, setCatalogRatings] = useState<Record<string, string>>({});
    // Measure the entire frame content, including portalled panels. The toolbar
    // height is independent, so the scroll limit cannot feed back into its own size.
    useEffect(() => {
      const navbar = navbarRef.current;
      const content = autocompleteRegionRef.current;
      if (!navbar || !content) return;
      const root = document.documentElement;
      const previousHeight = root.style.getPropertyValue("--frame-border-top-width");
      const previousToolbar = root.style.getPropertyValue("--frame-toolbar-height");
      const fitTopEdge = () => {
        const toolbarHeight = Math.ceil(navbar.getBoundingClientRect().height);
        const height = Math.ceil(content.getBoundingClientRect().height);
        if (toolbarHeight > 0) root.style.setProperty("--frame-toolbar-height", `${toolbarHeight}px`);
        if (height > 0) root.style.setProperty("--frame-border-top-width", `${height}px`);
      };
      fitTopEdge();
      const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fitTopEdge);
      observer?.observe(content);
      observer?.observe(navbar);
      return () => {
        observer?.disconnect();
        if (previousHeight) root.style.setProperty("--frame-border-top-width", previousHeight);
        else root.style.removeProperty("--frame-border-top-width");
        if (previousToolbar) root.style.setProperty("--frame-toolbar-height", previousToolbar);
        else root.style.removeProperty("--frame-toolbar-height");
      };
    }, []);

    const [selection, setSelection] = useState<LibrarySelection>(null);
    const [movieResults, setMovieResults] = useState<MovieAutocompleteResult[]>(
      [],
    );
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
    const addExpanded = isAddExpanded || Boolean(query) || isBusy;

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

    const focusAddInputHandle = useWorkspaceSearchInputHandle(inputRef);
    const focusAddInput = useCallback(() => {
      setIsAddExpanded(true);
      window.requestAnimationFrame(focusAddInputHandle);
    }, [focusAddInputHandle]);
    const focusSearchInput = useCallback(() => {
      setIsSearchExpanded(true);
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });
    }, []);
    useImperativeHandle(forwardedRef, () => ({ focusSearchInput, focusAddInput }), [
      focusSearchInput, focusAddInput,
    ]);

    useWorkspaceAutocompleteDismiss(autocompleteRegionRef, () => {
      setIsFocused(false);
      if (!query && !isBusy) setIsAddExpanded(false);
      hideAutocomplete();
    });

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.isComposing || modalOpen) return;
        const target = event.target instanceof Element ? event.target : null;
        const editing = Boolean(target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
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

    const clearQuery = useCallback(() => {
      setQuery("");
      setSelection(null);
      setMovieResults([]);
      setActionError(null);
      setShowRecommend(false);
      hideAutocomplete();
    }, [hideAutocomplete]);

    const selectRow = useCallback(
      async (row: LibraryAutocompleteRow) => {
        if (row.selection?.kind === "library-movie") {
          revealLibraryItem(row.selection);
          hideAutocomplete();
          clearQuery();
          return;
        }
        if (row.selection?.kind === "movie-result") {
          setSelection(row.selection);
          setQuery(row.selection.title);
          setActionError(null);
          hideAutocomplete();
          window.requestAnimationFrame(() => inputRef.current?.focus());
          return;
        }

        setSelection(row.selection);
        setQuery(row.title);
        hideAutocomplete();
        inputRef.current?.focus();
      },
      [
        clearQuery,
        hideAutocomplete,
        revealLibraryItem,
      ],
    );

    const submitKindAction = useCallback(
      async (kind: LibrarySubmitKind) => {
        if (isBusy || !trimmed) {
          return;
        }
        if (kind === "show-movie" || kind === "show-place") {
          revealLibraryItem(selection);
          hideAutocomplete();
          return;
        }

        setIsBusy(true);
        setActionError(null);
        try {
          const movieTitle =
            selection?.kind === "movie-result" ? selection.title : trimmed;
          const movieMeta =
            selection?.kind === "movie-result"
              ? { imdbID: selection.imdbID, type: selection.type }
              : undefined;

          if (isGuest) {
            const suggestion = await addSuggestion(
              movieTitle,
              undefined,
              guestName.trim() || undefined,
              movieMeta,
            );
            showToast({
              message: `"${movieTitle}" sent to movie suggestions as ${suggestion.suggestedBy}.`,
              type: "success",
            });
          } else {
            const added = await addMovie(movieTitle, movieMeta);
            showToast({
              message: `"${movieTitle}" added to movies!`,
              type: "success",
              actionLabel: "Undo",
              onAction: () => void deleteMovie(added.id),
            });
            window.requestAnimationFrame(() => {
              window.setTimeout(() => {
                const movieElement = document.querySelector(
                  `[data-movie-id="${added.id}"]`,
                );
                movieElement?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                movieElement
                  ?.querySelector<HTMLButtonElement>(
                    ".movie-item-details-hit-area",
                  )
                  ?.click();
              }, 120);
            });
          }
          clearQuery();
          window.requestAnimationFrame(focusAddInput);
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
        focusAddInput,
        guestName,
        hideAutocomplete,
        isBusy,
        isGuest,
        selection,
        showToast,
        trimmed,
        revealLibraryItem,
      ],
    );

    const handlePrimary = useCallback(() => {
      void submitKindAction(submitKind);
    }, [submitKind, submitKindAction]);

    const handleRecommend = useCallback(async () => {
      if (isBusy || !trimmed) {
        return;
      }
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

    // Search responses omit ratings. Enrich only visible IMDb matches using the
    // existing metadata cache, without delaying autocomplete or accepting stale responses.
    useEffect(() => {
      if (!isFocused || !isOpen || isLoading) return;
      const controller = new AbortController();
      void concurrentMap(movieResults.slice(0, 6), 2, async (result) => {
        if (!result.imdbID || controller.signal.aborted) return;
        try {
          const metadata = await fetchOmdbMetadataCached(result.title, result.type, result.imdbID, controller.signal);
          if (!controller.signal.aborted && metadata.imdbRating && metadata.imdbRating !== "N/A") {
            setCatalogRatings((ratings) => ({ ...ratings, [result.imdbID!]: metadata.imdbRating! }));
          }
        } catch {
          // A missing rating must never prevent selecting or saving a title.
        }
      });
      return () => controller.abort();
    }, [isFocused, isOpen, isLoading, movieResults]);

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

    const commandDock = (
      <div className="workspace-search__stage curved-library-search y2k-command-dock" role="navigation" aria-label="Movie controls">
        <div
            ref={autocompleteRegionRef}
            className={`curved-library-search__boundary y2k-command-dock__boundary${showPanel && isOpen ? " is-autocomplete-active" : ""}${isFocused ? " is-focused" : ""}`}
            onFocusCapture={onFocusCapture}
            onBlurCapture={onBlurCapture}
          >
            <div ref={navbarRef} className="y2k-command-dock__bar" inert={modalOpen}>
              <div
                className={`y2k-library-search y2k-symbol-control${searchExpanded ? " is-expanded" : ""}`}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget) && !searchQuery) setIsSearchExpanded(false);
                }}
              >
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
                  <svg className="frame-command-art" viewBox="0 145 865 550" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
                    <image href="/avatars/search_aaron_electra_pixel_icon.png" width="865" height="865" />
                  </svg>
                  <span className="frame-command-label" aria-hidden="true">Search</span>
                </button>
                <div className="y2k-symbol-control__field" hidden={!searchExpanded}>
                  <input
                    id={searchInputId}
                    ref={searchInputRef}
                    type="search"
                    className="y2k-search-capsule__input"
                    value={searchQuery}
                    onChange={(event) => onSearchQueryChange(event.target.value)}
                    placeholder="Search movies..."
                    aria-label="Search your watchlist"
                    autoComplete="off"
                    onKeyDown={(event) => {
                      if (event.nativeEvent.isComposing) return;
                      if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        onSearchQueryChange("");
                        setIsSearchExpanded(false);
                        searchTriggerRef.current?.focus();
                      }
                    }}
                  />
                  {searchQuery ? <button
                    type="button"
                    className="y2k-search-capsule__clear"
                    aria-label="Clear watchlist search"
                    onClick={() => {
                      onSearchQueryChange("");
                      searchInputRef.current?.focus();
                    }}
                  ><X size={14} /></button> : <kbd className="y2k-search-capsule__kbd" aria-hidden="true">/</kbd>}
                </div>
              </div>
              <form
                className={`y2k-search-form y2k-add-form y2k-symbol-control${addExpanded ? " is-expanded" : ""}`}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsFocused(false);
                    if (!query && !isBusy) setIsAddExpanded(false);
                  }
                }}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (isBusy || !hasQuery) return;
                  clearFocusBoundaryCheck();
                  hideAutocomplete();
                  inputRef.current?.blur();
                  handlePrimary();
                }}
              >
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
                    <svg className="frame-command-art" viewBox="0 145 823 540" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
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
                      isOpen && activeIndex >= 0
                        ? `${listId}-option-${activeIndex}`
                        : undefined
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
                        window.requestAnimationFrame(() =>
                          inputRef.current?.focus(),
                        );
                      }}
                      aria-label="Clear title to add"
                      title="Clear title"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <kbd
                      className="y2k-search-capsule__kbd"
                      aria-hidden="true"
                      title="Press Cmd/Ctrl+K to add"
                    >
                      ⌘K
                    </kbd>
                  )}

                  {hasQuery || isBusy ? <button
                    type="submit"
                    className="y2k-search-capsule__submit is-ready"
                    disabled={isBusy || !hasQuery}
                  >
                    <span>{isBusy ? "Saving…" : primaryLabel}</span>
                    <CornerDownLeft size={13} aria-hidden="true" />
                  </button> : null}
                  </div>
                </div>
              </form>

              {filterSlot ? (
                <>
                  <div
                    className="y2k-command-dock__divider"
                    aria-hidden="true"
                  />
                  <div
                    className="y2k-command-dock__filters"
                    onPointerDown={() => {
                      if (isOpen) {
                        hideAutocomplete();
                      }
                    }}
                  >
                    {filterSlot}
                  </div>
                </>
              ) : null}
              <button
                ref={pickerTriggerRef}
                type="button"
                className="frame-picker-trigger"
                aria-label="Pick a movie"
                aria-expanded={pickerOpen}
                aria-controls="top-frame-movie-picker"
                onClick={() => setPickerOpen((open) => !open)}
              >
                <svg className="frame-picker-art" viewBox="300 190 1180 585" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
                  <image href="/avatars/pick-a-movie-pixel-button.png" width="1773" height="887" />
                </svg>
              </button>
              <NavbarToastViewport />
            </div>
            <TopFrameViewport />
            {pickerOpen ? <TopFramePanel name="picker">
              <section id="top-frame-movie-picker" className="frame-movie-picker" aria-label="Movie picker">
                <div className="frame-panel-heading"><h2>Pick a movie</h2><button type="button" onClick={closePicker} aria-label="Close movie picker"><X size={20} /></button></div>
                <React.Suspense fallback={<p role="status">Loading movie picker…</p>}><MoviePickerPanel /></React.Suspense>
              </section>
            </TopFramePanel> : null}

            {selection?.kind === "movie-result" ||
            (hasQuery && submitKind === "movie" && currentUser) ? (
              <div className="y2k-command-dock__subbar">
                {selection?.kind === "movie-result" ? (
                  <div
                    className="curved-library-search__selection"
                    role="status"
                    aria-live="polite"
                  >
                    <span>
                      <span aria-hidden="true">✓</span> Selected{" "}
                      <strong>{selection.title}</strong>
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
                                  fallbackLetter={row.title
                                    .charAt(0)
                                    .toUpperCase()}
                                />
                              ) : (
                                <span
                                  className="workspace-search__autocomplete-poster"
                                  aria-hidden
                                >
                                  {row.icon}
                                </span>
                              )}
                              <WorkspaceAutocompleteCopy
                                title={row.title}
                                meta={row.selection.kind === "movie-result" && row.selection.imdbID && catalogRatings[row.selection.imdbID]
                                  ? `${row.meta} • IMDb ${catalogRatings[row.selection.imdbID]}`
                                  : row.meta}
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
              <span
                className="workspace-search__error-dot"
                aria-hidden="true"
              />
              <span>{actionError}</span>
            </div>
          ) : null}
        </div>
      );

    return (
      <>
        {typeof document !== "undefined"
          ? createPortal(<>{commandDock}<div className="frame-corner-profiles y2k-command-dock__profiles" role="region" aria-label="Account controls" inert={modalOpen}><ProfileMenu /></div><AccountPinViewport /></>, document.body)
          : commandDock}
        {showRecommend && currentUser && hasQuery ? (
          <MovieRecommendationComposer
            currentUser={currentUser}
            movieTitle={
              selection?.kind === "movie-result" ? selection.title : trimmed
            }
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
