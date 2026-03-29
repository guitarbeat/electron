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
import { Input } from '@/ui/FormFields';
import { motion } from '@/theme/tokens';
import { PlusIcon } from '@/common/icons';
import {
  searchMovieAutocomplete,
  type MovieAutocompleteResult,
} from '@/services/metadataService';
import RecommendationComposer from './RecommendationComposer';
import {
  getNextMovieAutocompleteIndex,
  getMovieAutocompleteEnterSelectionIndex,
  hasStoredMovieAutocompleteFeedback,
  MOVIE_AUTOCOMPLETE_DEBOUNCE_MS,
  MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH,
  normalizeMovieAutocompleteQuery,
  shouldClearSelectedMovieResult,
  shouldFetchMovieAutocomplete,
} from './watchlistAutocomplete';

interface WatchlistTopControlsProps {
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
  canRecommend: boolean;
}

export interface WatchlistTopControlsHandle {
  focusSearchInput: () => void;
}

const WatchlistTopControls = React.forwardRef<
  WatchlistTopControlsHandle,
  WatchlistTopControlsProps
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
  canRecommend,
}, forwardedRef) => {
  const hasSearchQuery = Boolean(searchQuery.trim());
  const isBusy = isAdding || isSubmittingRecommendation;
  const autocompleteRegionRef = useRef<HTMLDivElement | null>(null);
  const internalSearchInputRef = useRef<HTMLInputElement | null>(null);
  const focusBoundaryFrameRef = useRef<number | null>(null);
  const autocompleteRequestIdRef = useRef(0);
  const autocompleteListId = useId();
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<MovieAutocompleteResult[]>([]);
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(-1);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  const [isAutocompleteRegionFocused, setIsAutocompleteRegionFocused] = useState(false);
  const trimmedSearchQuery = searchQuery.trim();
  const normalizedSearchQuery = normalizeMovieAutocompleteQuery(searchQuery);
  const isGuest = !currentUser;
  const primaryActionLabel = isGuest ? 'Suggest' : 'Add';
  const primaryActionTitle = isGuest ? 'Send title to suggestions' : 'Add title to watchlist';
  const helperText = isGuest
    ? `Not signed in? ${guestName.trim() || 'Guest'} can still send titles to Suggestions for Aaron or Electra to approve.`
    : 'Add titles straight to the shared queue, or open the composer to leave a note first.';

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

        input.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
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
    setIsAutocompleteOpen(true);
    setActiveAutocompleteIndex(-1);
  }, []);

  const hideAutocomplete = useCallback(() => {
    setIsAutocompleteOpen(false);
    setActiveAutocompleteIndex(-1);
    setIsAutocompleteLoading(false);
  }, []);

  const resetAutocomplete = useCallback(() => {
    autocompleteRequestIdRef.current += 1;
    setAutocompleteQuery('');
    setAutocompleteResults([]);
    setActiveAutocompleteIndex(-1);
    setIsAutocompleteOpen(false);
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
      if (!(target instanceof Node)) {
        return;
      }

      if (!autocompleteRegionRef.current?.contains(target)) {
        setIsAutocompleteRegionFocused(false);
        hideAutocomplete();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [hideAutocomplete]);

  useEffect(() => () => clearFocusBoundaryCheck(), [clearFocusBoundaryCheck]);

  useEffect(() => {
    if (!isAutocompleteRegionFocused) {
      hideAutocomplete();
      return;
    }

    if (normalizedSearchQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      resetAutocomplete();
      return;
    }

    if (!shouldFetchMovieAutocomplete(trimmedSearchQuery, selectedAutocompleteResult)) {
      return;
    }

    const abortController = new AbortController();
    const requestId = autocompleteRequestIdRef.current + 1;
    autocompleteRequestIdRef.current = requestId;
    setAutocompleteQuery(normalizedSearchQuery);
    setAutocompleteResults([]);
    setActiveAutocompleteIndex(-1);
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
        setActiveAutocompleteIndex(-1);
      } catch (error) {
        if (autocompleteRequestIdRef.current !== requestId || abortController.signal.aborted) {
          return;
        }

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

  return (
    <section
      className="workspace-control-panel ui-control-surface watchlist-top-controls"
      style={{
        animation: `slide-in-left ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
      <div className="watchlist-top-controls__toolbar">
        <form
          className="watchlist-top-controls__search-form"
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
            className="watchlist-top-controls__search-shell"
            onFocusCapture={() => {
              clearFocusBoundaryCheck();
              setIsAutocompleteRegionFocused(true);
            }}
            onBlurCapture={() => {
              clearFocusBoundaryCheck();
              focusBoundaryFrameRef.current = window.requestAnimationFrame(() => {
                focusBoundaryFrameRef.current = null;
                const nextIsFocused = Boolean(
                  autocompleteRegionRef.current?.contains(document.activeElement)
                );
                setIsAutocompleteRegionFocused(nextIsFocused);
                if (!nextIsFocused) {
                  hideAutocomplete();
                }
              });
            }}
          >
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
                if (
                  hasAutocompleteFeedback
                ) {
                  openAutocomplete();
                }
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) {
                  return;
                }

                if (event.key === 'ArrowDown') {
                  if (autocompleteResults.length === 0) {
                    return;
                  }

                  event.preventDefault();
                  setIsAutocompleteOpen(true);
                  setActiveAutocompleteIndex((currentIndex) =>
                    getNextMovieAutocompleteIndex(currentIndex, 'next', autocompleteResults.length)
                  );
                  return;
                }

                if (event.key === 'ArrowUp') {
                  if (autocompleteResults.length === 0) {
                    return;
                  }

                  event.preventDefault();
                  setIsAutocompleteOpen(true);
                  setActiveAutocompleteIndex((currentIndex) =>
                    getNextMovieAutocompleteIndex(currentIndex, 'previous', autocompleteResults.length)
                  );
                  return;
                }

                if (event.key === 'Escape') {
                  if (isAutocompleteOpen) {
                    event.preventDefault();
                    hideAutocomplete();
                  }
                  return;
                }

                if (event.key === 'Enter' && isAutocompleteOpen) {
                  const selectedIndex = getMovieAutocompleteEnterSelectionIndex(
                    activeAutocompleteIndex,
                    autocompleteResults.length
                  );
                  if (selectedIndex < 0 || !autocompleteResults[selectedIndex]) {
                    return;
                  }

                  event.preventDefault();
                  selectAutocompleteResult(autocompleteResults[selectedIndex]);
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
            {isAutocompleteOpen && hasAutocompleteFeedback && (
              <div
                id={autocompleteListId}
                className="watchlist-top-controls__autocomplete"
                role="listbox"
                aria-label="Movie and show suggestions"
              >
                {isAutocompleteLoading ? (
                  <div className="watchlist-top-controls__autocomplete-status" role="status">
                    Searching titles...
                  </div>
                ) : autocompleteError ? (
                  <div className="watchlist-top-controls__autocomplete-status" role="alert">
                    {autocompleteError}
                  </div>
                ) : autocompleteResults.length > 0 ? (
                  autocompleteResults.map((result, index) => (
                    <button
                      key={result.imdbID}
                      id={`${autocompleteListId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeAutocompleteIndex}
                      className={`watchlist-top-controls__autocomplete-option ${
                        index === activeAutocompleteIndex ? 'is-active' : ''
                      }`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onMouseEnter={() => setActiveAutocompleteIndex(index)}
                      onClick={() => selectAutocompleteResult(result)}
                    >
                      <span className="watchlist-top-controls__autocomplete-poster">
                        {result.posterUrl ? (
                          <img
                            src={result.posterUrl}
                            alt=""
                            className="watchlist-top-controls__autocomplete-poster-image"
                          />
                        ) : (
                          <span className="watchlist-top-controls__autocomplete-poster-fallback" aria-hidden>
                            {result.title.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="watchlist-top-controls__autocomplete-copy">
                        <span className="watchlist-top-controls__autocomplete-title">{result.title}</span>
                        <span className="watchlist-top-controls__autocomplete-meta">
                          {result.type === 'series' ? 'TV series' : 'Movie'}
                          {result.year ? ` • ${result.year}` : ''}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="watchlist-top-controls__autocomplete-status">
                    No titles found for “{trimmedSearchQuery}”
                  </div>
                )}
              </div>
            )}
          </div>
          {hasSearchQuery && (
            <div className="watchlist-top-controls__search-actions">
              <Button
                type="submit"
                variant="secondary"
                size="md"
                isLoading={isAdding}
                loadingText="Adding"
                disabled={isBusy}
                title={primaryActionTitle}
                aria-label={primaryActionTitle}
                className="watchlist-top-controls__search-button"
                style={{ minWidth: '84px' }}
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
                disabled={isBusy || !canRecommend}
                title={isGuest ? 'Add a note for this suggestion' : 'Recommend movie'}
                aria-label={isGuest ? 'Add a note for this suggestion' : 'Recommend movie'}
                leftIcon={<PlusIcon />}
              >
                {isGuest ? 'Add a note' : 'Recommend'}
              </Button>
            </div>
          )}
        </form>
      </div>

      <p className="watchlist-top-controls__helper">{helperText}</p>

      {showRecommendationComposer && hasSearchQuery && (
        <RecommendationComposer
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
        <div className="places-top-controls__error" role="alert">
          {suggestionError}
        </div>
      )}
    </section>
  );
});

WatchlistTopControls.displayName = 'WatchlistTopControls';

export default WatchlistTopControls;
