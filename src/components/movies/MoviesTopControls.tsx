
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

function AutocompletePosterImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt=""
      className={`watchlist-top-controls__autocomplete-poster-image${loaded ? " is-loaded" : ""}`}
      onLoad={() => setLoaded(true)}
    />
  );
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

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!autocompleteRegionRef.current?.contains(target)) {
        setIsAutocompleteRegionFocused(false);
        hideAutocomplete();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [hideAutocomplete]);

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
      <div className="watchlist-top-controls__stage">
        <form
          className={`watchlist-top-controls__search-form watchlist-top-controls__search-form--stack${
            isAutocompleteElevated ? ' is-autocomplete-active' : ''
          }`}
          onSubmit={handleFormSubmit}
        >
          <div
            ref={autocompleteRegionRef}
            className="watchlist-top-controls__search-shell"
            onFocusCapture={() => {
              clearFocusBoundaryCheck();
              setIsAutocompleteRegionFocused(true);
            }}
            onBlurCapture={() => {
              clearFocusBoundaryCheck();
              focusBoundaryFrameRef.current = window.requestAnimationFrame(() => {
                focusBoundaryFrameRef.current = null;
                if (dropdownInteractionPendingRef.current) return;
                const nextIsFocused = Boolean(autocompleteRegionRef.current?.contains(document.activeElement));
                setIsAutocompleteRegionFocused(nextIsFocused);
                if (!nextIsFocused) hideAutocomplete();
              });
            }}
          >
            <div className="watchlist-top-controls__search-input-wrap">
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
                placeholder="Add a movie or show title"
                aria-label="Movie or show title"
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
                <button
                  type="button"
                  className="watchlist-top-controls__search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedAutocompleteResult(null);
                    resetAutocomplete();
                    internalSearchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Autocomplete dropdown */}
            {isAutocompleteMounted && hasAutocompleteFeedback && (
              <div
                id={autocompleteListId}
                className={`watchlist-top-controls__autocomplete${isAutocompleteOpen ? " is-open" : ""}`}
                role="listbox"
                aria-label="Movie and show suggestions"
                onPointerDown={() => {
                  dropdownInteractionPendingRef.current = true;
                  window.setTimeout(() => { dropdownInteractionPendingRef.current = false; }, 300);
                }}
              >
                {isAutocompleteLoading && (
                  <div
                    className="watchlist-top-controls__autocomplete-loading"
                    role="status"
                    aria-label="Searching"
                  >
                    <span className="watchlist-top-controls__autocomplete-loading-dot" />
                    <span className="watchlist-top-controls__autocomplete-loading-dot" />
                    <span className="watchlist-top-controls__autocomplete-loading-dot" />
                  </div>
                )}
                {!isAutocompleteLoading && autocompleteResults.length > 0 && (
                  <div
                    className="watchlist-top-controls__autocomplete-filters"
                  >
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
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {label}
                              <span style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '1px 6px',
                                borderRadius: '999px',
                                fontSize: '0.85em',
                                opacity: count === 0 ? 0.5 : 1
                              }}>{count}</span>
                            </span>
                          ),
                          disabled: isDisabled
                        };
                      })}
                      activeValue={autocompleteTypeFilter}
                      onChange={setAutocompleteTypeFilter}
                      ariaLabel="Filter by type"
                    />
                  </div>
                )}
                {autocompleteError ? (
                  <div className="watchlist-top-controls__autocomplete-status" role="alert">
                    {autocompleteError}
                  </div>
                ) : autocompleteResults.length > 0 ? (() => {
                  if (filteredAutocompleteResults.length === 0) {
                    return (
                      <div className="watchlist-top-controls__autocomplete-status">
                        No {autocompleteTypeFilter === 'series' ? 'TV series' : 'movies'} found
                      </div>
                    );
                  }
                  return filteredAutocompleteResults.map((result, index) => (
                    <button
                      key={result.imdbID ?? `${result.title}-${index}`}
                      id={`${autocompleteListId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeAutocompleteIndex}
                      className={`watchlist-top-controls__autocomplete-option ${
                        index === activeAutocompleteIndex ? "is-active" : ""
                      }`}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        selectAutocompleteResult(result);
                      }}
                      onMouseEnter={() => setActiveAutocompleteIndex(index)}
                    >
                      <span className="watchlist-top-controls__autocomplete-poster">
                        {result.poster ? (
                          <AutocompletePosterImage src={result.poster} />
                        ) : (
                          <span
                            className="watchlist-top-controls__autocomplete-poster-fallback"
                            aria-hidden
                          >
                            {result.title.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="watchlist-top-controls__autocomplete-copy">
                        <span className="watchlist-top-controls__autocomplete-title">
                          {result.title}
                        </span>
                        <span className="watchlist-top-controls__autocomplete-meta">
                          {result.type === "series" ? "TV series" : "Movie"}
                          {result.year ? ` • ${result.year}` : ""}
                        </span>
                      </span>
                    </button>
                  ));
                })() : !isAutocompleteLoading ? (
                  <div className="watchlist-top-controls__autocomplete-status">
                    No titles found for &quot;{trimmedSearchQuery}&quot;
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {hasSearchQuery ? (
              <div className="watchlist-top-controls__search-actions">
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
              </div>
          ) : null}
        </form>
      </div>

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

      {suggestionError && !showRecommendationComposer && (
        <div className="watchlist-top-controls__error" role="alert">
          {suggestionError}
        </div>
      )}
    </>
  );
});

MoviesTopControls.displayName = 'MoviesTopControls';

export default MoviesTopControls;
