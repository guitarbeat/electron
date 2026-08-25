import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui";
import { PlusIcon } from "@/common/Icons";
import { useUser, useToast } from "@/app/providerContexts";
import { useMovies } from "@/hooks/movies";
import { useSuggestions } from "@/hooks/suggestions";
import { usePlaces, usePlaceSuggestions } from "@/hooks/places";
import { searchMovieAutocomplete } from "@/services/metadata";
import type { MovieAutocompleteResult } from "@/services/metadata";
import {
  MOVIE_AUTOCOMPLETE_DEBOUNCE_MS,
  MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from "@/components/movies";

import { MovieRecommendationComposer } from "@/components/movies";
import {
  WorkspaceSearchActions,
  CurvedInput,
} from "@/components/ui";
import { WorkspaceAutocompleteCopy,
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
import { LIBRARY_PLACES_ANCHOR_ID } from "@/utils/workspaceConfig";
import {
  buildLibraryAutocompleteRows,
  classifyLibraryIntent,
  libraryAlternateKind,
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
}

const revealLibraryItem = (selection: LibrarySelection) => {
  if (selection?.kind === "library-movie") {
    document
      .querySelector(`[data-movie-id="${selection.movieId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (selection?.kind === "library-place") {
    document
      .getElementById(`place-card-${selection.placeId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const LibrarySearch = React.forwardRef<LibrarySearchHandle>((_, forwardedRef) => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const { movies, addMovie } = useMovies(currentUser);
  const { addSuggestion } = useSuggestions();
  const { places, addPlace } = usePlaces(currentUser);
  const { addPlaceSuggestion } = usePlaceSuggestions();

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRegionRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const dropdownInteractionPendingRef = useRef(false);
  const listId = useId();

  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<LibrarySelection>(null);
  const [movieResults, setMovieResults] = useState<MovieAutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
        places,
        movieResults,
      }),
    [movieResults, movies, places, trimmed],
  );
  const submitKind = resolveLibrarySubmitKind({
    query: trimmed,
    selection,
    movieResultCount: movieResults.length,
  });
  const alternateKind = libraryAlternateKind(submitKind);
  const primaryLabel = librarySubmitLabel(submitKind, isGuest);
  const hasQuery = trimmed.length > 0;

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

  const focusSearchInput = useWorkspaceSearchInputHandle(inputRef);
  useImperativeHandle(forwardedRef, () => ({ focusSearchInput }), [focusSearchInput]);

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
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [focusSearchInput]);

  useEffect(() => {
    if (!isFocused) {
      hideAutocomplete();
      return;
    }
    if (normalized.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      requestIdRef.current += 1;
      setMovieResults([]);
      setFetchError(null);
      setIsLoading(false);
      return;
    }
    if (classifyLibraryIntent(trimmed) === "place") {
      requestIdRef.current += 1;
      setMovieResults([]);
      setFetchError(null);
      setIsLoading(false);
      setIsMounted(true);
      setIsOpen(true);
      return;
    }

    const abortController = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsMounted(true);
    setIsOpen(true);
    setIsLoading(true);
    setFetchError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResults = await searchMovieAutocomplete(trimmed, {
          signal: abortController.signal,
        });
        if (requestIdRef.current !== requestId || abortController.signal.aborted) {
          return;
        }
        setMovieResults(nextResults);
        resetActiveIndex();
      } catch (error) {
        if (requestIdRef.current !== requestId || abortController.signal.aborted) {
          return;
        }
        setMovieResults([]);
        setFetchError(
          error instanceof Error && error.message
            ? error.message
            : "Suggestions are unavailable right now.",
        );
      } finally {
        if (requestIdRef.current === requestId && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, MOVIE_AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [hideAutocomplete, isFocused, normalized, resetActiveIndex, trimmed]);

  useEffect(() => {
    if (trimmed.length >= 2 && isFocused) {
      setIsMounted(true);
      setIsOpen(true);
    }
  }, [isFocused, trimmed.length]);

  const selectRow = useCallback((row: LibraryAutocompleteRow) => {
    setSelection(row.selection);
    setQuery(row.title);
    hideAutocomplete();
    inputRef.current?.focus();
  }, [hideAutocomplete]);

  const clearQuery = useCallback(() => {
    setQuery("");
    setSelection(null);
    setMovieResults([]);
    setActionError(null);
    setShowRecommend(false);
    hideAutocomplete();
  }, [hideAutocomplete]);

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
        const placeName =
          selection?.kind === "place-draft" ? selection.name : trimmed;

        if (kind === "movie") {
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
            showToast({ message: `"${movieTitle}" added to movies!`, type: "success" });
            window.requestAnimationFrame(() => {
              document
                .querySelector(`[data-movie-id="${added.id}"]`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
          }
        } else if (isGuest) {
          await addPlaceSuggestion(placeName);
          showToast({
            message: `"${placeName}" suggested as a place!`,
            type: "success",
          });
        } else {
          await addPlace(placeName);
          showToast({ message: `"${placeName}" added to places!`, type: "success" });
          window.requestAnimationFrame(() => {
            document
              .getElementById(LIBRARY_PLACES_ANCHOR_ID)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
        clearQuery();
        window.requestAnimationFrame(focusSearchInput);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not save that right now.";
        setActionError(message);
        showToast({ message, type: "error" });
      } finally {
        setIsBusy(false);
      }
    },
    [
      addMovie,
      addPlace,
      addPlaceSuggestion,
      addSuggestion,
      clearQuery,
      focusSearchInput,
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
        error instanceof Error ? error.message : "Could not send that recommendation.";
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

  const showPanel = isMounted && (isLoading || rows.length > 0 || Boolean(fetchError) || trimmed.length >= 2);

  return (
    <>
      <div className="workspace-search__stage curved-library-search">
        <div
          ref={autocompleteRegionRef}
          className={`curved-library-search__boundary${showPanel && isOpen ? " is-autocomplete-active" : ""}`}
          onFocusCapture={onFocusCapture}
          onBlurCapture={onBlurCapture}
        >
          <CurvedInput
            ref={inputRef}
            value={query}
            onChange={(nextValue) => {
              setQuery(nextValue);
              setSelection(null);
              setActionError(null);
              setShowRecommend(false);
            }}
            onSubmit={() => {
              if (isBusy || !hasQuery) return;
              clearFocusBoundaryCheck();
              hideAutocomplete();
              inputRef.current?.blur();
              handlePrimary();
            }}
            buttonText={primaryLabel}
            isBusy={isBusy}
            buttonDisabled={!hasQuery}
            placeholder="Add a movie, show, or place"
            aria-label="Search movies, shows, and places to add"
            combobox={{
              expanded: isOpen,
              controlsId: listId,
              activeDescendantId:
                isOpen && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined,
            }}
            onFocus={() => {
              setIsFocused(true);
              if (trimmed.length >= 2) {
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
                if (isOpen) {
                  event.preventDefault();
                  hideAutocomplete();
                }
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
          {showPanel ? (
            <WorkspaceAutocompletePanel
              id={listId}
              isOpen={isOpen}
              ariaLabel="Movie, show, and place suggestions"
              onPointerDown={() => {
                dropdownInteractionPendingRef.current = true;
                window.setTimeout(() => {
                  dropdownInteractionPendingRef.current = false;
                }, 300);
              }}
            >
              {isLoading ? <WorkspaceAutocompleteLoading /> : null}
              {fetchError ? (
                <WorkspaceAutocompleteStatus role="alert">{fetchError}</WorkspaceAutocompleteStatus>
              ) : null}
              {!isLoading && rows.length === 0 && trimmed.length >= 2 ? (
                <WorkspaceAutocompleteStatus>
                  No matches yet — add this as a movie or a place.
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
                            <WorkspaceAutocompleteCopy title={row.title} meta={row.meta} />
                          </WorkspaceAutocompleteOption>
                        );
                      })}
                    </React.Fragment>
                  ))
                : null}
            </WorkspaceAutocompletePanel>
          ) : null}
          {hasQuery && (alternateKind || submitKind === "movie") ? (
            <WorkspaceSearchActions className="curved-library-search__secondary-actions">
              {alternateKind ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  disabled={isBusy}
                  onClick={() => void submitKindAction(alternateKind)}
                >
                  {librarySubmitLabel(alternateKind, isGuest)}
                </Button>
              ) : null}
              {submitKind === "movie" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  disabled={isBusy}
                  leftIcon={<PlusIcon />}
                  onClick={() => {
                    hideAutocomplete();
                    setShowRecommend(true);
                  }}
                >
                  Recommend
                </Button>
              ) : null}
            </WorkspaceSearchActions>
          ) : null}
        </div>
        {actionError ? (
          <div className="workspace-search__error" role="alert">
            <span className="workspace-search__error-dot" aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        ) : null}
      </div>
      {showRecommend && hasQuery ? (
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
});

LibrarySearch.displayName = "LibrarySearch";

export default LibrarySearch;
