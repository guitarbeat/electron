import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, Search, Sparkles, X } from "lucide-react";
import { Button, ProfileMenu } from "@/components/ui";
import { PlusIcon } from "@/common/Icons";
import { useUser, useToast } from "@/app/providerContexts";
import { useMovies } from "@/hooks/movies";
import { useSuggestions } from "@/hooks/suggestions";
import {
  searchMovieAutocomplete,
  getCachedMovieAutocomplete,
} from "@/services/metadata";
import type { MovieAutocompleteResult } from "@/services/metadata";
import {
  MOVIE_AUTOCOMPLETE_DEBOUNCE_MS,
  MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from "@/components/movies";
import "@/app/styles/curved-input.css";
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

export interface LibrarySearchHandle {
  focusSearchInput: () => void;
  focusAddInput?: () => void;
}

export interface LibrarySearchProps {
  filterSlot?: React.ReactNode;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

const revealLibraryItem = (selection: LibrarySelection) => {
  if (selection?.kind === "library-movie") {
    const movieElement = document.querySelector(
      `[data-movie-id="${selection.movieId}"]`,
    );
    if (movieElement) {
      movieElement.scrollIntoView({ behavior: "smooth", block: "center" });
      const hitArea = movieElement.querySelector<HTMLButtonElement>(
        ".movie-item-details-hit-area",
      );
      if (hitArea) {
        window.setTimeout(() => {
          hitArea.click();
        }, 150);
      }
    }
  }
};

const LibrarySearch = React.forwardRef<LibrarySearchHandle, LibrarySearchProps>(
  ({ filterSlot, searchQuery, onSearchQueryChange }, forwardedRef) => {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [internalSearchQuery, setInternalSearchQuery] = useState("");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isAddExpanded, setIsAddExpanded] = useState(false);

    const isControlled = typeof onSearchQueryChange === "function";
    const effectiveSearchQuery = isControlled
      ? (searchQuery ?? "")
      : internalSearchQuery;
    const handleSearchChange = useCallback(
      (val: string) => {
        if (isControlled) {
          onSearchQueryChange!(val);
        } else {
          setInternalSearchQuery(val);
        }
      },
      [isControlled, onSearchQueryChange],
    );

    const isSearchActive =
      isSearchExpanded ||
      isSearchFocused ||
      Boolean(effectiveSearchQuery.trim());

    const { currentUser } = useUser();
    const { showToast } = useToast();
    const { movies, addMovie, deleteMovie } = useMovies(currentUser);
    const { addSuggestion } = useSuggestions();

    const inputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRegionRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const dropdownInteractionPendingRef = useRef(false);
    const listId = useId();

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
        onFocusStateChange: setIsFocused,
      });

    const focusSearchInput = useCallback(() => {
      setIsSearchExpanded(true);
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });
    }, []);
    const focusAddInputHandle = useWorkspaceSearchInputHandle(inputRef);
    const focusAddInput = useCallback(() => {
      setIsAddExpanded(true);
      window.requestAnimationFrame(() => {
        focusAddInputHandle();
      });
    }, [focusAddInputHandle]);
    useImperativeHandle(
      forwardedRef,
      () => ({
        focusSearchInput,
        focusAddInput,
      }),
      [focusSearchInput, focusAddInput],
    );

    useWorkspaceAutocompleteDismiss(autocompleteRegionRef, () => {
      setIsFocused(false);
      hideAutocomplete();
    });

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === "/" &&
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLTextAreaElement) &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          event.preventDefault();
          focusSearchInput();
        } else if (
          (event.key === "k" || event.key === "K") &&
          (event.metaKey || event.ctrlKey) &&
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLTextAreaElement)
        ) {
          event.preventDefault();
          focusAddInput();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [focusAddInput, focusSearchInput]);

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

    useEffect(() => {
      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      };

      window.addEventListener("keydown", handleGlobalKeyDown);
      return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

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
          setIsAddExpanded(false);
          setIsFocused(false);
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
        selection,
        showToast,
        trimmed,
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

    const isAddActive =
      isAddExpanded ||
      isFocused ||
      Boolean(trimmed.length > 0) ||
      isOpen ||
      showRecommend ||
      selection !== null;

    const showPanel =
      isMounted &&
      (isLoading ||
        rows.length > 0 ||
        Boolean(fetchError) ||
        trimmed.length >= 2);

    const commandDock = (
      <div className="workspace-search__stage curved-library-search y2k-command-dock">
        <div
            ref={autocompleteRegionRef}
            className={`curved-library-search__boundary y2k-command-dock__boundary${showPanel && isOpen ? " is-autocomplete-active" : ""}${isFocused || isSearchFocused ? " is-focused" : ""}`}
            onFocusCapture={onFocusCapture}
            onBlurCapture={onBlurCapture}
          >
            <div className="y2k-command-dock__bar">
              {/* 1. Decoupled Search Bar (Symbol only by default, expands when clicked) */}
              <div
                className={`y2k-search-bar-wrap${isSearchActive ? " is-expanded" : " is-collapsed"}`}
              >
                <div
                  className={`y2k-search-capsule y2k-search-capsule--search${isSearchActive ? " is-expanded" : " is-collapsed"}${isSearchFocused ? " is-focused" : ""}`}
                >
                  <button
                    type="button"
                    className="y2k-search-capsule__icon-btn"
                    onClick={(e) => {
                      if (isSearchActive && !effectiveSearchQuery) {
                        e.stopPropagation();
                        setIsSearchExpanded(false);
                        setIsSearchFocused(false);
                        searchInputRef.current?.blur();
                      } else if (!isSearchActive) {
                        setIsSearchExpanded(true);
                        window.requestAnimationFrame(() =>
                          searchInputRef.current?.focus(),
                        );
                      }
                    }}
                    title={isSearchActive ? "Collapse search" : "Search movies (/)"}
                    aria-label={isSearchActive ? "Collapse search" : "Search movies (/)"}
                  >
                    <span
                      className="y2k-search-capsule__icon"
                      aria-hidden="true"
                    >
                      <Search size={15} strokeWidth={2.4} />
                    </span>
                  </button>

                  <input
                    ref={searchInputRef}
                    type="text"
                    className="y2k-search-capsule__input"
                    value={effectiveSearchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Search movies..."
                    aria-label="Search movies in library"
                    autoComplete="off"
                    spellCheck={false}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      setIsSearchExpanded(true);
                    }}
                    onBlur={() => {
                      setIsSearchFocused(false);
                      if (!effectiveSearchQuery.trim()) {
                        setIsSearchExpanded(false);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        handleSearchChange("");
                        setIsSearchExpanded(false);
                        setIsSearchFocused(false);
                        searchInputRef.current?.blur();
                      }
                    }}
                  />

                  {effectiveSearchQuery ? (
                    <button
                      type="button"
                      className="y2k-search-capsule__clear"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSearchChange("");
                        window.requestAnimationFrame(() =>
                          searchInputRef.current?.focus(),
                        );
                      }}
                      aria-label="Clear library search"
                      title="Clear search"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <kbd
                      className="y2k-search-capsule__kbd"
                      aria-hidden="true"
                      title="Press / to search"
                    >
                      /
                    </kbd>
                  )}
                </div>
              </div>

              {/* 2. Decoupled Add Bar (Symbol only by default, expands when clicked) */}
              <form
                className={`y2k-search-form y2k-add-form${isAddActive ? " is-expanded" : " is-collapsed"}`}
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
                  className={`y2k-search-capsule y2k-search-capsule--add${isAddActive ? " is-expanded" : " is-collapsed"}${isFocused ? " is-focused" : ""}${isLoading || isBusy ? " is-loading" : ""}`}
                >
                  <button
                    type="button"
                    className="y2k-search-capsule__icon-btn"
                    onClick={(e) => {
                      if (isAddActive && !query && !selection) {
                        e.stopPropagation();
                        setIsAddExpanded(false);
                        setIsFocused(false);
                        inputRef.current?.blur();
                      } else if (!isAddActive) {
                        setIsAddExpanded(true);
                        window.requestAnimationFrame(() =>
                          inputRef.current?.focus(),
                        );
                      }
                    }}
                    title={isAddActive ? "Collapse add bar" : "Add a movie or show (Cmd+K)"}
                    aria-label={isAddActive ? "Collapse add bar" : "Add a movie or show (Cmd+K)"}
                  >
                    <span
                      className="y2k-search-capsule__icon"
                      aria-hidden="true"
                    >
                      {isLoading || isBusy ? (
                        <Sparkles size={15} strokeWidth={2.3} />
                      ) : (
                        <Plus size={15} strokeWidth={2.5} />
                      )}
                    </span>
                  </button>

                  <input
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
                      setIsAddExpanded(true);
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
                    onBlur={() => {
                      setIsFocused(false);
                      if (!query.trim() && !selection && !isOpen && !showRecommend) {
                        setIsAddExpanded(false);
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
                        setIsFocused(false);
                        inputRef.current?.blur();
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
                      aria-label="Clear add query"
                      title="Clear"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    className={`y2k-search-capsule__submit${hasQuery ? " is-ready" : " is-idle"}`}
                    disabled={isBusy || !hasQuery}
                  >
                    <span>{isBusy ? "Saving…" : primaryLabel}</span>
                    {hasQuery && !isBusy ? (
                      <span className="y2k-search-capsule__enter-hint" style={{ fontSize: "0.72rem", opacity: 0.8, marginLeft: "0.2rem", fontWeight: 800 }}>
                        ↵
                      </span>
                    ) : null}
                  </button>
                </div>

                {showPanel ? (
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
                                    meta={row.meta}
                                  />
                                </WorkspaceAutocompleteOption>
                              );
                            })}
                          </React.Fragment>
                        ))
                      : null}
                  </WorkspaceAutocompletePanel>
                ) : null}
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

              <div
                className="y2k-command-dock__divider"
                aria-hidden="true"
              />
              <div
                className="y2k-command-dock__profiles"
                role="region"
                aria-label="Quick profile controls"
                onPointerDown={() => {
                  if (isOpen) {
                    hideAutocomplete();
                  }
                }}
              >
                <ProfileMenu />
              </div>
            </div>

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
        {commandDock}
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
