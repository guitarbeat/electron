
import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { User } from '@/shared/types';
import Button from '@/ui/Button';
import MagicToggle from '@/components/ui/MagicToggle';
import { Input } from '@/ui/FormFields';
import { PlusIcon } from '@/common/Icons';
import {
  searchMovieAutocomplete,
  type MovieAutocompleteResult,
} from '@/services/metadata';
import MovieRecommendationComposer from './MovieRecommendationComposer';

import {
  getNextMovieAutocompleteIndex,
  getMovieAutocompleteEnterSelectionIndex,
  hasStoredMovieAutocompleteFeedback,
  MOVIE_AUTOCOMPLETE_DEBOUNCE_MS,
  MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH,
  normalizeMovieAutocompleteQuery,
  shouldClearSelectedMovieResult,
  shouldFetchMovieAutocomplete,
} from './lib/movieAutocomplete';
import { useViewport } from '@/app/ViewportContext';
import WorkspaceSearchShell from '@/components/ui/WorkspaceSearchShell';
import WorkspaceSearchClear from '@/components/ui/WorkspaceSearchClear';
import WorkspaceSearchActions from '@/components/ui/WorkspaceSearchActions';
import {
  WorkspaceAutocompleteCopy,
  WorkspaceAutocompleteLoading,
  WorkspaceAutocompleteOption,
  WorkspaceAutocompletePanel,
  WorkspaceAutocompletePoster,
  WorkspaceAutocompleteStatus,
} from '@/components/ui/WorkspaceAutocomplete';
import { useWorkspaceAutocompleteDismiss } from '@/components/ui/lib/useWorkspaceAutocompleteDismiss';

interface MoviesTopControlsProps {
  currentUser: User | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedAutocompleteResult: MovieAutocompleteResult | null;
  setSelectedAutocompleteResult: (value: MovieAutocompleteResult | null) => void;
  guestName: string;
  setGuestName: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onRecommend: () => void;
  onSubmitRecommendation: () => Promise<void> | void;
  onCancelRecommendation: () => void;
  recommendationReason: string;
  setRecommendationReason: (value: string) => void;
  showRecommendationComposer: boolean;
  isAdding: boolean;
  isSubmittingRecommendation: boolean;
  suggestionError: string | null;
}

export interface MoviesTopControlsHandle {
  focusSearchInput: () => void;
}

const MoviesTopControls = React.forwardRef<
  MoviesTopControlsHandle,
  MoviesTopControlsProps
>(({
  currentUser,
  searchQuery,
  setSearchQuery,
  selectedAutocompleteResult,
  setSelectedAutocompleteResult,
  guestName,
  setGuestName,
  onSubmit,
  onRecommend,
  onSubmitRecommendation,
  onCancelRecommendation,
  recommendationReason,
  setRecommendationReason,
  showRecommendationComposer,
  isAdding,
  isSubmittingRecommendation,
  suggestionError,
}, forwardedRef) => {
  const hasSearchQuery = Boolean(searchQuery.trim());
  const isBusy = isAdding || isSubmittingRecommendation;
  const autocompleteRegionRef = useRef<HTMLDivElement | null>(null);
  const internalSearchInputRef = useRef<HTMLInputElement | null>(null);
  const focusBoundaryFrameRef = useRef<number | null>(null);
  const autocompleteRequestIdRef = useRef(0);
  const dropdownInteractionPendingRef = useRef(false);
  const autocompleteListId = useId();

  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<MovieAutocompleteResult[]>([]);
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(-1);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isAutocompleteMounted, setIsAutocompleteMounted] = useState(false);
  const autocompleteCloseTimerRef = useRef<number | null>(null);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  const [isAutocompleteRegionFocused, setIsAutocompleteRegionFocused] = useState(false);
  const [autocompleteTypeFilter, setAutocompleteTypeFilter] = useState<'all' | 'movie' | 'series'>('all');

  const trimmedSearchQuery = searchQuery.trim();
  const normalizedSearchQuery = normalizeMovieAutocompleteQuery(searchQuery);
  const isGuest = !currentUser;
  const { isMobile } = useViewport();
  const primaryActionLabel = isGuest ? 'Suggest' : 'Add';
  const primaryActionTitle = isGuest ? 'Send title to suggestions' : 'Add title to movies';
  const noteActionLabel = isGuest
    ? isMobile
      ? "Note"
      : "Add a note"
    : "Recommend";

  useImperativeHandle(
    forwardedRef,
    () => ({
      focusSearchInput: () => {
        const input = internalSearchInputRef.current;
        if (!input) return;
        if (document.activeElement !== input) input.focus();
      },
    }),
    [],
  );

  const clearFocusBoundaryCheck = useCallback(() => {
    if (focusBoundaryFrameRef.current !== null) {
      window.cancelAnimationFrame(focusBoundaryFrameRef.current);
      focusBoundaryFrameRef.current = null;
    }
  }, []);

  const openAutocomplete = useCallback(() => {
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteMounted(true);
    setIsAutocompleteOpen(true);
    setActiveAutocompleteIndex(-1);
  }, []);

  const hideAutocomplete = useCallback(() => {
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteOpen(false);
    setActiveAutocompleteIndex(-1);
    setIsAutocompleteLoading(false);
    setAutocompleteTypeFilter('all');
    setIsAutocompleteMounted(false);
  }, []);

  const resetAutocomplete = useCallback(() => {
    autocompleteRequestIdRef.current += 1;
    setAutocompleteQuery('');
    setAutocompleteResults([]);
    setActiveAutocompleteIndex(-1);
    setIsAutocompleteOpen(false);
    setIsAutocompleteMounted(false);
    setAutocompleteTypeFilter('all');
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteLoading(false);
    setAutocompleteError(null);
  }, []);

  const selectAutocompleteResult = useCallback(
    (result: MovieAutocompleteResult) => {
      setSelectedAutocompleteResult(result);
      setSearchQuery(result.title);
      hideAutocomplete();
    },
    [hideAutocomplete, setSearchQuery, setSelectedAutocompleteResult]
  );

  useWorkspaceAutocompleteDismiss(autocompleteRegionRef, () => {
    setIsAutocompleteRegionFocused(false);
    hideAutocomplete();
  });

  useEffect(() => {
    if (!isMobile) {
      return undefined;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return undefined;
    }

    const keepSearchVisible = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) {
        return;
      }
      if (!autocompleteRegionRef.current?.contains(active)) {
        return;
      }

      const panel = autocompleteRegionRef.current.closest(
        ".watchlist-top-controls__search-form",
      );
      if (!panel) {
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      const viewportBottom = viewport.offsetTop + viewport.height;
      if (panelRect.bottom > viewportBottom - 8) {
        panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };

    viewport.addEventListener("resize", keepSearchVisible);
    viewport.addEventListener("scroll", keepSearchVisible);
    return () => {
      viewport.removeEventListener("resize", keepSearchVisible);
      viewport.removeEventListener("scroll", keepSearchVisible);
    };
  }, [isMobile]);

  useEffect(() => () => clearFocusBoundaryCheck(), [clearFocusBoundaryCheck]);
  useEffect(() => () => {
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isAutocompleteRegionFocused) {
      hideAutocomplete();
      return;
    }
    if (normalizedSearchQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      resetAutocomplete();
      return;
    }
    if (!shouldFetchMovieAutocomplete(trimmedSearchQuery, selectedAutocompleteResult)) return;

    const abortController = new AbortController();
    const requestId = autocompleteRequestIdRef.current + 1;
    autocompleteRequestIdRef.current = requestId;
    setAutocompleteQuery(normalizedSearchQuery);
    setActiveAutocompleteIndex(-1);
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteMounted(true);
    setIsAutocompleteOpen(true);
    setIsAutocompleteLoading(true);
    setAutocompleteError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResults = await searchMovieAutocomplete(trimmedSearchQuery, {
          signal: abortController.signal,
        });
        if (autocompleteRequestIdRef.current !== requestId || abortController.signal.aborted) return;
        setAutocompleteQuery(normalizedSearchQuery);
        setAutocompleteResults(nextResults);
        setActiveAutocompleteIndex(-1);
      } catch (error) {
        if (autocompleteRequestIdRef.current !== requestId || abortController.signal.aborted) return;
        setAutocompleteQuery(normalizedSearchQuery);
        setAutocompleteResults([]);
        setActiveAutocompleteIndex(-1);
        setAutocompleteError(
          error instanceof Error && error.message
            ? error.message
            : 'Movie suggestions are unavailable right now.'
        );
      } finally {
        if (autocompleteRequestIdRef.current === requestId && !abortController.signal.aborted) {
          setIsAutocompleteLoading(false);
        }
      }
    }, MOVIE_AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [
    hideAutocomplete,
    isAutocompleteRegionFocused,
    normalizedSearchQuery,
    resetAutocomplete,
    selectedAutocompleteResult,
    trimmedSearchQuery,
  ]);

  const hasAutocompleteFeedback = useMemo(
    () =>
      isAutocompleteLoading ||
      hasStoredMovieAutocompleteFeedback(
        trimmedSearchQuery,
        autocompleteQuery,
        autocompleteResults.length,
        autocompleteError,
      ),
    [autocompleteError, autocompleteQuery, autocompleteResults.length, isAutocompleteLoading, trimmedSearchQuery]
  );
  const isAutocompleteElevated = isAutocompleteMounted && hasAutocompleteFeedback;
  const filteredAutocompleteResults = useMemo(
    () =>
      autocompleteTypeFilter === 'all'
        ? autocompleteResults
        : autocompleteResults.filter((result) => result.type === autocompleteTypeFilter),
    [autocompleteResults, autocompleteTypeFilter]
  );

  useEffect(() => {
    setActiveAutocompleteIndex((currentIndex) => {
      if (filteredAutocompleteResults.length === 0) return -1;
      return currentIndex >= 0 && currentIndex < filteredAutocompleteResults.length ? currentIndex : -1;
    });
  }, [filteredAutocompleteResults.length]);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isBusy) return;
      clearFocusBoundaryCheck();
      hideAutocomplete();
      internalSearchInputRef.current?.blur();
      void onSubmit();
    },
    [clearFocusBoundaryCheck, hideAutocomplete, isBusy, onSubmit],
  );

  return (
    <>
      <WorkspaceSearchShell
        icon="🎬"
        isAutocompleteActive={isAutocompleteElevated}
        onSubmit={handleFormSubmit}
        shellRef={autocompleteRegionRef}
        onShellFocusCapture={() => {
          clearFocusBoundaryCheck();
          setIsAutocompleteRegionFocused(true);
        }}
        onShellBlurCapture={() => {
          clearFocusBoundaryCheck();
          focusBoundaryFrameRef.current = window.requestAnimationFrame(() => {
            focusBoundaryFrameRef.current = null;
            if (dropdownInteractionPendingRef.current) return;
            const nextIsFocused = Boolean(
              autocompleteRegionRef.current?.contains(document.activeElement),
            );
            setIsAutocompleteRegionFocused(nextIsFocused);
            if (!nextIsFocused) hideAutocomplete();
          });
        }}
        error={suggestionError && !showRecommendationComposer ? suggestionError : null}
        input={
          <>
            <Input
              ref={internalSearchInputRef}
              className="watchlist-top-controls__search-field"
              value={searchQuery}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearchQuery(nextValue);
                if (shouldClearSelectedMovieResult(nextValue, selectedAutocompleteResult)) {
                  setSelectedAutocompleteResult(null);
                }
              }}
              onFocus={() => {
                setIsAutocompleteRegionFocused(true);
                if (hasAutocompleteFeedback) openAutocomplete();
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;

                if (event.key === 'ArrowDown') {
                  if (filteredAutocompleteResults.length === 0) return;
                  event.preventDefault();
                  setIsAutocompleteOpen(true);
                  setActiveAutocompleteIndex((currentIndex) =>
                    getNextMovieAutocompleteIndex(currentIndex, 'next', filteredAutocompleteResults.length)
                  );
                  return;
                }
                if (event.key === 'ArrowUp') {
                  if (filteredAutocompleteResults.length === 0) return;
                  event.preventDefault();
                  setIsAutocompleteOpen(true);
                  setActiveAutocompleteIndex((currentIndex) =>
                    getNextMovieAutocompleteIndex(currentIndex, 'previous', filteredAutocompleteResults.length)
                  );
                  return;
                }
                if (event.key === 'Escape') {
                  if (isAutocompleteOpen) { event.preventDefault(); hideAutocomplete(); }
                  return;
                }
                if (event.key === 'Enter' && isAutocompleteOpen) {
                  const selectedIndex = getMovieAutocompleteEnterSelectionIndex(
                    activeAutocompleteIndex,
                    filteredAutocompleteResults.length
                  );
                  if (selectedIndex < 0 || !filteredAutocompleteResults[selectedIndex]) return;
                  event.preventDefault();
                  selectAutocompleteResult(filteredAutocompleteResults[selectedIndex]);
                  return;
                }
                if (event.key === 'Enter') {
                  event.preventDefault();
                  clearFocusBoundaryCheck();
                  hideAutocomplete();
                  internalSearchInputRef.current?.blur();
                  void onSubmit();
                }
              }}
              placeholder="What's on tonight? Search a movie or show to add."
              aria-label="Search movies and shows to add"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isAutocompleteOpen}
              aria-controls={autocompleteListId}
              aria-activedescendant={
                isAutocompleteOpen && activeAutocompleteIndex >= 0
                  ? `${autocompleteListId}-option-${activeAutocompleteIndex}`
                  : undefined
              }
              autoComplete="off"
              fullWidth
            />
            {searchQuery ? (
              <WorkspaceSearchClear
                onClick={() => {
                  setSearchQuery("");
                  setSelectedAutocompleteResult(null);
                  resetAutocomplete();
                  internalSearchInputRef.current?.focus();
                }}
              />
            ) : null}
          </>
        }
        autocomplete={
          isAutocompleteMounted && hasAutocompleteFeedback ? (
            <WorkspaceAutocompletePanel
              id={autocompleteListId}
              isOpen={isAutocompleteOpen}
              ariaLabel="Movie and show suggestions"
              onPointerDown={() => {
                dropdownInteractionPendingRef.current = true;
                window.setTimeout(() => {
                  dropdownInteractionPendingRef.current = false;
                }, 300);
              }}
            >
              {isAutocompleteLoading ? <WorkspaceAutocompleteLoading /> : null}
              {!isAutocompleteLoading && autocompleteResults.length > 0 && (
                <div className="watchlist-top-controls__autocomplete-filters">
                  <MagicToggle<'all' | 'movie' | 'series'>
                    options={(
                      [
                        { value: 'all', label: 'All' },
                        { value: 'movie', label: 'Movies' },
                        { value: 'series', label: 'TV Series' },
                      ] as const
                    ).map(({ value, label }) => {
                      const count =
                        value === 'all'
                          ? autocompleteResults.length
                          : autocompleteResults.filter((r) => r.type === value).length;
                      const isDisabled = count === 0 && value !== 'all';
                      return {
                        value,
                        label: (
                          <span className="watchlist-top-controls__autocomplete-filter-label">
                            {label}
                            <span className="watchlist-top-controls__autocomplete-filter-count">
                              {count}
                            </span>
                          </span>
                        ),
                        disabled: isDisabled,
                      };
                    })}
                    activeValue={autocompleteTypeFilter}
                    onChange={setAutocompleteTypeFilter}
                    ariaLabel="Filter by type"
                  />
                </div>
              )}
              {autocompleteError ? (
                <WorkspaceAutocompleteStatus role="alert">
                  {autocompleteError}
                </WorkspaceAutocompleteStatus>
              ) : autocompleteResults.length > 0 ? (() => {
                if (filteredAutocompleteResults.length === 0) {
                  return (
                    <WorkspaceAutocompleteStatus>
                      No {autocompleteTypeFilter === 'series' ? 'TV series' : 'movies'} found
                    </WorkspaceAutocompleteStatus>
                  );
                }
                return filteredAutocompleteResults.map((result, index) => (
                  <WorkspaceAutocompleteOption
                    key={result.imdbID ?? `${result.title}-${index}`}
                    id={`${autocompleteListId}-option-${index}`}
                    isActive={index === activeAutocompleteIndex}
                    onSelect={() => selectAutocompleteResult(result)}
                    onHover={() => setActiveAutocompleteIndex(index)}
                  >
                    <WorkspaceAutocompletePoster
                      src={result.poster}
                      fallbackLetter={result.title.charAt(0).toUpperCase()}
                    />
                    <WorkspaceAutocompleteCopy
                      title={result.title}
                      meta={`${result.type === "series" ? "TV series" : "Movie"}${result.year ? ` • ${result.year}` : ""}`}
                    />
                  </WorkspaceAutocompleteOption>
                ));
              })() : !isAutocompleteLoading ? (
                <WorkspaceAutocompleteStatus>
                  No titles found for &quot;{trimmedSearchQuery}&quot;
                </WorkspaceAutocompleteStatus>
              ) : null}
            </WorkspaceAutocompletePanel>
          ) : null
        }
        actions={
          hasSearchQuery ? (
            <WorkspaceSearchActions>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAdding}
                loadingText={isGuest ? 'Suggesting' : 'Adding'}
                disabled={isBusy}
                title={primaryActionTitle}
                aria-label={primaryActionTitle}
                className="watchlist-top-controls__search-button"
              >
                {primaryActionLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => {
                  hideAutocomplete();
                  onRecommend();
                }}
                disabled={isBusy}
                title={isGuest ? 'Add a note for this suggestion' : 'Recommend movie'}
                aria-label={isGuest ? 'Add a note for this suggestion' : 'Recommend movie'}
                leftIcon={<PlusIcon />}
              >
                {noteActionLabel}
              </Button>
            </WorkspaceSearchActions>
          ) : null
        }
      />

      {showRecommendationComposer && hasSearchQuery && (
        <MovieRecommendationComposer
          currentUser={currentUser}
          movieTitle={searchQuery.trim()}
          guestName={guestName}
          reason={recommendationReason}
          error={suggestionError}
          isSubmitting={isSubmittingRecommendation}
          onGuestNameChange={setGuestName}
          onReasonChange={setRecommendationReason}
          onSubmit={onSubmitRecommendation}
          onCancel={onCancelRecommendation}
        />
      )}

    </>
  );
});

MoviesTopControls.displayName = 'MoviesTopControls';

export default MoviesTopControls;
