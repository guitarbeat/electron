import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
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
  MOVIE_AUTOCOMPLETE_DEBOUNCE_MS,
  MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH,
  shouldClearSelectedMovieResult,
  shouldFetchMovieAutocomplete,
} from './watchlistAutocomplete';

interface WatchlistTopControlsProps {
  currentUser: User | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedAutocompleteResult: MovieAutocompleteResult | null;
  setSelectedAutocompleteResult: (value: MovieAutocompleteResult | null) => void;
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

const WatchlistTopControls: React.FC<WatchlistTopControlsProps> = ({
  currentUser,
  searchQuery,
  setSearchQuery,
  selectedAutocompleteResult,
  setSelectedAutocompleteResult,
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
}) => {
  const hasSearchQuery = Boolean(searchQuery.trim());
  const isBusy = isAdding || isSubmittingRecommendation;
  const searchFormRef = useRef<HTMLFormElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRequestIdRef = useRef(0);
  const autocompleteListId = useId();
  const [autocompleteResults, setAutocompleteResults] = useState<MovieAutocompleteResult[]>([]);
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(-1);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  const [hasAutocompleteFocus, setHasAutocompleteFocus] = useState(false);
  const trimmedSearchQuery = searchQuery.trim();

  const closeAutocomplete = useCallback(() => {
    autocompleteRequestIdRef.current += 1;
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
      closeAutocomplete();
      searchInputRef.current?.focus();
    },
    [closeAutocomplete, setSearchQuery, setSelectedAutocompleteResult]
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!searchFormRef.current?.contains(target)) {
        setHasAutocompleteFocus(false);
        closeAutocomplete();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [closeAutocomplete]);

  useEffect(() => {
    if (!hasAutocompleteFocus || !shouldFetchMovieAutocomplete(trimmedSearchQuery, selectedAutocompleteResult)) {
      closeAutocomplete();
      return;
    }

    const requestId = autocompleteRequestIdRef.current + 1;
    autocompleteRequestIdRef.current = requestId;
    setIsAutocompleteOpen(true);
    setIsAutocompleteLoading(true);
    setAutocompleteError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResults = await searchMovieAutocomplete(trimmedSearchQuery);
        if (autocompleteRequestIdRef.current !== requestId) {
          return;
        }

        setAutocompleteResults(nextResults);
        setActiveAutocompleteIndex(nextResults.length > 0 ? 0 : -1);
      } catch (error) {
        if (autocompleteRequestIdRef.current !== requestId) {
          return;
        }

        setAutocompleteResults([]);
        setActiveAutocompleteIndex(-1);
        setAutocompleteError(
          error instanceof Error && error.message
            ? error.message
            : 'Movie suggestions are unavailable right now.'
        );
      } finally {
        if (autocompleteRequestIdRef.current === requestId) {
          setIsAutocompleteLoading(false);
        }
      }
    }, MOVIE_AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [closeAutocomplete, hasAutocompleteFocus, selectedAutocompleteResult, trimmedSearchQuery]);

  const hasAutocompleteFeedback = useMemo(
    () =>
      isAutocompleteLoading ||
      autocompleteError !== null ||
      autocompleteResults.length > 0,
    [autocompleteError, autocompleteResults.length, isAutocompleteLoading]
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
          ref={searchFormRef}
          className="watchlist-top-controls__search-form"
          onSubmit={(event) => {
            event.preventDefault();
            closeAutocomplete();
            void onSubmit();
          }}
        >
          <div className="watchlist-top-controls__search-shell">
            <Input
              ref={searchInputRef}
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
                setHasAutocompleteFocus(true);
                if (
                  trimmedSearchQuery.length >= MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH &&
                  hasAutocompleteFeedback
                ) {
                  setIsAutocompleteOpen(true);
                }
              }}
              onKeyDown={(event) => {
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
                    closeAutocomplete();
                  }
                  return;
                }

                if (event.key === 'Tab') {
                  closeAutocomplete();
                  return;
                }

                if (
                  event.key === 'Enter' &&
                  isAutocompleteOpen &&
                  activeAutocompleteIndex >= 0 &&
                  autocompleteResults[activeAutocompleteIndex]
                ) {
                  event.preventDefault();
                  selectAutocompleteResult(autocompleteResults[activeAutocompleteIndex]);
                }
              }}
              placeholder="Add a movie title"
              aria-label="Movie title"
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
                aria-label="Movie suggestions"
              >
                {isAutocompleteLoading ? (
                  <div className="watchlist-top-controls__autocomplete-status" role="status">
                    Searching movies...
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
                          {result.year || 'Release year unavailable'}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="watchlist-top-controls__autocomplete-status">
                    No movies found for “{trimmedSearchQuery}”
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
                disabled={isSubmittingRecommendation}
                title="Add movie to watchlist"
                aria-label="Add movie to watchlist"
                className="watchlist-top-controls__search-button"
                style={{ minWidth: '84px' }}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => {
                  closeAutocomplete();
                  onRecommend();
                }}
                disabled={isBusy || !canRecommend}
                title="Recommend movie"
                aria-label="Recommend movie"
                leftIcon={<PlusIcon />}
              >
                Recommend
              </Button>
            </div>
          )}
        </form>
      </div>

      {showRecommendationComposer && hasSearchQuery && (
        <RecommendationComposer
          currentUser={currentUser}
          movieTitle={searchQuery.trim()}
          reason={recommendationReason}
          error={suggestionError}
          isSubmitting={isSubmittingRecommendation}
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
};

export default WatchlistTopControls;
