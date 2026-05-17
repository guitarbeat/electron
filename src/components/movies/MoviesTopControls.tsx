import React, { useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '@/shared/types';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import { PlusIcon } from '@/common/Icons';
import {
  searchMovieAutocomplete,
  type MovieAutocompleteResult,
} from '@/services/metadata';
import MovieRecommendationComposer from './MovieRecommendationComposer';
import { useAppHeaderSlot } from '@/app/AppHeaderSlot';

import {
  hasStoredMovieAutocompleteFeedback,
  MOVIE_AUTOCOMPLETE_DEBOUNCE_MS,
  MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH,
  normalizeMovieAutocompleteQuery,
  getNextMovieAutocompleteIndex,
} from './lib/movieAutocomplete';

interface MoviesTopControlsProps {
  currentUser: User | null;
  upNextCount: number;
  watchedCount: number;
  noteCount: number;
  latestNoteMovieTitle?: string | null;
  latestNoteAuthor?: string | null;
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
  canRecommend: boolean;
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
      className={`watchlist-top-controls__autocomplete-poster-image${loaded ? ' is-loaded' : ''}`}
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
  canRecommend,
}, forwardedRef) => {
  const slot = useAppHeaderSlot();

  useEffect(() => {
    if (!slot) return;
    slot.setHasSearch(true);
    return () => slot.setHasSearch(false);
  }, [slot]);

  const hasSearchQuery = Boolean(searchQuery.trim());
  const isBusy = isAdding || isSubmittingRecommendation;
  const autocompleteRegionRef = useRef<HTMLDivElement | null>(null);
  const internalSearchInputRef = useRef<HTMLInputElement | null>(null);
  const focusBoundaryFrameRef = useRef<number | null>(null);
  const autocompleteRequestIdRef = useRef(0);
  // On iOS Safari, buttons don't receive focus on tap, so document.activeElement
  // stays on <body> when the input blurs. This flag prevents a false "outside click"
  // dismissal while the user is interacting with the dropdown.
  const dropdownInteractionPendingRef = useRef(false);
  const autocompleteListId = useId();
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<MovieAutocompleteResult[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isAutocompleteMounted, setIsAutocompleteMounted] = useState(false);
  const autocompleteCloseTimerRef = useRef<number | null>(null);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  const [autocompleteTypeFilter, setAutocompleteTypeFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(-1);
  const trimmedSearchQuery = searchQuery.trim();
  const normalizedSearchQuery = normalizeMovieAutocompleteQuery(searchQuery);
  const isGuest = !currentUser;
  const primaryActionLabel = isGuest ? 'Suggest' : 'Add';
  const primaryActionTitle = isGuest ? 'Send title to suggestions' : 'Add title to movies';

  useImperativeHandle(
    forwardedRef,
    () => ({
      focusSearchInput: () => {
        const input = internalSearchInputRef.current;
        if (!input) {
          return;
        }

        if (document.activeElement !== input) {
          input.focus();
        }
      },
    }),
    []
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
  }, []);

  const hideAutocomplete = useCallback(() => {
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteOpen(false);
    setIsAutocompleteLoading(false);
    setAutocompleteTypeFilter('all');
    setIsAutocompleteMounted(false);
  }, []);

  const resetAutocomplete = useCallback(() => {
    autocompleteRequestIdRef.current += 1;
    setAutocompleteQuery('');
    setAutocompleteResults([]);
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
      if (!autocompleteRegionRef.current?.contains(target)) hideAutocomplete();
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
    if (normalizedSearchQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      resetAutocomplete();
      return;
    }

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
        if (autocompleteRequestIdRef.current !== requestId || abortController.signal.aborted) {
          return;
        }

        setAutocompleteQuery(normalizedSearchQuery);
        setAutocompleteResults(nextResults);
      } catch (error) {
        if (autocompleteRequestIdRef.current !== requestId || abortController.signal.aborted) {
          return;
        }

        setAutocompleteQuery(normalizedSearchQuery);
        setAutocompleteResults([]);
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
  }, [hideAutocomplete, normalizedSearchQuery, resetAutocomplete, trimmedSearchQuery]);

  const hasAutocompleteFeedback = useMemo(
    () =>
      isAutocompleteLoading ||
      hasStoredMovieAutocompleteFeedback(
        trimmedSearchQuery,
        autocompleteQuery,
        autocompleteResults.length,
        autocompleteError
      ),
    [
      autocompleteError,
      autocompleteQuery,
      autocompleteResults.length,
      isAutocompleteLoading,
      trimmedSearchQuery,
    ]
  );
  const filteredAutocompleteResults = useMemo(
    () =>
      autocompleteTypeFilter === 'all'
        ? autocompleteResults
        : autocompleteResults.filter((result) => result.type === autocompleteTypeFilter),
    [autocompleteResults, autocompleteTypeFilter]
  );

  const searchForm = (
    <form
      className="watchlist-top-controls__search-form watchlist-top-controls__search-form--in-header"
      onSubmit={(event) => {
        event.preventDefault();
        clearFocusBoundaryCheck();
        hideAutocomplete();
        internalSearchInputRef.current?.blur();
        void onSubmit();
      }}
    >
          <div
            ref={autocompleteRegionRef}
            className="watchlist-top-controls__search-shell watchlist-top-controls__search-shell--with-icon"
            onBlurCapture={() => {
              clearFocusBoundaryCheck();
              focusBoundaryFrameRef.current = window.requestAnimationFrame(() => {
                focusBoundaryFrameRef.current = null;
                if (dropdownInteractionPendingRef.current) return;
                if (!autocompleteRegionRef.current?.contains(document.activeElement)) hideAutocomplete();
              });
            }}
          >
            <div style={{ position: 'relative', width: '100%', flex: 1 }}>
              <Input
                ref={internalSearchInputRef}
                className="watchlist-top-controls__search-field"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedAutocompleteResult(null);
                }}
                onFocus={() => {
                  if (hasAutocompleteFeedback) openAutocomplete();
                }}
                onKeyDown={(event) => {
                  if (!isAutocompleteOpen) return;
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveAutocompleteIndex(
                      getNextMovieAutocompleteIndex(activeAutocompleteIndex, 'next', filteredAutocompleteResults.length)
                    );
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveAutocompleteIndex(
                      getNextMovieAutocompleteIndex(activeAutocompleteIndex, 'previous', filteredAutocompleteResults.length)
                    );
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    hideAutocomplete();
                    setActiveAutocompleteIndex(-1);
                  } else if (event.key === 'Enter' && activeAutocompleteIndex >= 0) {
                    const result = filteredAutocompleteResults[activeAutocompleteIndex];
                    if (result) {
                      event.preventDefault();
                      selectAutocompleteResult(result);
                    }
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
              {searchQuery && (
                <button
                  type="button"
                  className="watchlist-top-controls__search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedAutocompleteResult(null);
                    resetAutocomplete();
                    internalSearchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                >
                  ✕
                </button>
              )}
            </div>
            {isAutocompleteMounted && hasAutocompleteFeedback && (
              createPortal(
                <div
                  className={`watchlist-top-controls__autocomplete-dropdown${isAutocompleteOpen ? ' is-open' : ''}`}
                  id={autocompleteListId}
                  role="listbox"
                  onPointerDown={() => {
                    dropdownInteractionPendingRef.current = true;
                  }}
                  onPointerUp={() => {
                    dropdownInteractionPendingRef.current = false;
                  }}
                >
                  <div className="watchlist-top-controls__autocomplete-header">
                    <div className="watchlist-top-controls__autocomplete-filters">
                      <button
                        type="button"
                        className={`watchlist-top-controls__autocomplete-filter${autocompleteTypeFilter === 'all' ? ' is-active' : ''}`}
                        onClick={() => setAutocompleteTypeFilter('all')}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className={`watchlist-top-controls__autocomplete-filter${autocompleteTypeFilter === 'movie' ? ' is-active' : ''}`}
                        onClick={() => setAutocompleteTypeFilter('movie')}
                      >
                        Movies
                      </button>
                      <button
                        type="button"
                        className={`watchlist-top-controls__autocomplete-filter${autocompleteTypeFilter === 'series' ? ' is-active' : ''}`}
                        onClick={() => setAutocompleteTypeFilter('series')}
                      >
                        Shows
                      </button>
                    </div>
                  </div>

                  <div className="watchlist-top-controls__autocomplete-body">
                    {isAutocompleteLoading ? (
                      <div className="watchlist-top-controls__autocomplete-status">
                        Searching for &ldquo;{autocompleteQuery}&rdquo;...
                      </div>
                    ) : autocompleteError ? (
                      <div className="watchlist-top-controls__autocomplete-status is-error">
                        {autocompleteError}
                      </div>
                    ) : filteredAutocompleteResults.length === 0 ? (
                      <div className="watchlist-top-controls__autocomplete-status">
                        No titles found for &ldquo;{autocompleteQuery}&rdquo;
                      </div>
                    ) : (
                      filteredAutocompleteResults.map((result, index) => (
                        <button
                          key={result.id}
                          id={`${autocompleteListId}-option-${index}`}
                          type="button"
                          className={`watchlist-top-controls__autocomplete-option${index === activeAutocompleteIndex ? ' is-active' : ''}`}
                          role="option"
                          aria-selected={index === activeAutocompleteIndex}
                          onClick={() => selectAutocompleteResult(result)}
                          onMouseEnter={() => setActiveAutocompleteIndex(index)}
                        >
                          <div className="watchlist-top-controls__autocomplete-option-poster">
                            {result.image ? (
                              <AutocompletePosterImage src={result.image} />
                            ) : (
                              <div className="watchlist-top-controls__autocomplete-option-poster-placeholder" />
                            )}
                          </div>
                          <div className="watchlist-top-controls__autocomplete-option-content">
                            <div className="watchlist-top-controls__autocomplete-option-title">
                              {result.title}
                            </div>
                            <div className="watchlist-top-controls__autocomplete-option-meta">
                              {result.year && <span>{result.year}</span>}
                              {result.type && (
                                <span className="watchlist-top-controls__autocomplete-option-type">
                                  {result.type === 'series' ? 'TV Show' : 'Movie'}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>,
                document.body
              )
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            className="watchlist-top-controls__submit-button"
            disabled={!hasSearchQuery || isBusy}
            loading={isAdding}
            title={primaryActionTitle}
          >
            {!isAdding && <PlusIcon className="watchlist-top-controls__submit-icon" />}
            <span className="watchlist-top-controls__submit-label">{primaryActionLabel}</span>
          </Button>
    </form>
  );

  return (
    <div className="watchlist-top-controls">
      {slot ? createPortal(searchForm, slot.container) : searchForm}

      {showRecommendationComposer && (
        <MovieRecommendationComposer
          movieTitle={searchQuery}
          reason={recommendationReason}
          setReason={setRecommendationReason}
          onSubmit={onSubmitRecommendation}
          onCancel={onCancelRecommendation}
          isSubmitting={isSubmittingRecommendation}
          guestName={guestName}
          setGuestName={setGuestName}
        />
      )}

      {suggestionError && (
        <div className="watchlist-top-controls__error-message" role="alert">
          {suggestionError}
        </div>
      )}
    </div>
  );
});

MoviesTopControls.displayName = 'MoviesTopControls';

export default MoviesTopControls;
