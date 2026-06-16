
import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  motion,
  AnimatePresence,
} from 'motion/react';
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
      className={`watchlist-top-controls__autocomplete-poster-image${loaded ? " is-loaded" : ""}`}
      onLoad={() => setLoaded(true)}
    />
  );
}

// Pre-computed particle configs (stable across renders)
function makeParticles(n: number) {
  return Array.from({ length: n }, () => ({
    xDelta: (Math.random() - 0.5) * 52,
    yDelta: (Math.random() - 0.5) * 28,
    scale:  Math.random() * 0.75 + 0.35,
    left:   `${Math.random() * 100}%`,
    top:    `${Math.random() * 100}%`,
    duration: Math.random() * 1.6 + 1.4,
    delay:  Math.random() * 0.8,
  }));
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
  canRecommend,
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

  // ── Motion state ─────────────────────────────────────────────────────────────
  const [isClicked, setIsClicked] = useState(false);
  const rippleKeyRef = useRef(0);
  const [clickOrigin, setClickOrigin] = useState({ x: 0, y: 0 });
  // Stable particle positions — compute once, never change
  const particleConfigs = useMemo(() => makeParticles(14), []);

  const trimmedSearchQuery = searchQuery.trim();
  const normalizedSearchQuery = normalizeMovieAutocompleteQuery(searchQuery);
  const isGuest = !currentUser;
  const primaryActionLabel = isGuest ? 'Suggest' : 'Add';
  const primaryActionTitle = isGuest ? 'Send title to suggestions' : 'Add title to movies';
  const isFocused = isAutocompleteRegionFocused;

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

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleShellClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setClickOrigin({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsClicked(true);
    window.setTimeout(() => setIsClicked(false), 700);
  }, []);

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
          {/* ── Search shell with motion glow ─────────────────────────────────── */}
          <motion.div
            ref={autocompleteRegionRef}
            className="watchlist-top-controls__search-shell"
            onClick={handleShellClick}
            animate={{
              boxShadow: isClicked
                ? '0 0 0 3px rgba(244,114,182,0.35), 0 0 40px rgba(244,114,182,0.25), 0 12px 22px rgba(2,4,20,0.3)'
                : isFocused
                  ? '0 0 0 2px rgba(244,114,182,0.22), 0 0 24px rgba(244,114,182,0.1), 0 12px 22px rgba(2,4,20,0.22)'
                  : '0 0 0 rgba(0,0,0,0)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
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
            style={{ position: 'relative' }}
          >
            {/* Animated gradient background layer (input-height only) */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  key="search-gradient"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 0.12,
                    background: [
                      'linear-gradient(110deg, rgba(244,114,182,0.9) 0%, rgba(99,102,241,0.9) 100%)',
                      'linear-gradient(110deg, rgba(99,102,241,0.9) 0%, rgba(125,211,252,0.9) 100%)',
                      'linear-gradient(110deg, rgba(125,211,252,0.9) 0%, rgba(244,114,182,0.9) 100%)',
                      'linear-gradient(110deg, rgba(244,114,182,0.9) 0%, rgba(99,102,241,0.9) 100%)',
                    ],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    background: { duration: 14, repeat: Infinity, ease: 'linear' },
                  }}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '3.25rem',
                    pointerEvents: 'none',
                    zIndex: 0,
                    borderRadius: 'inherit',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Floating particles (clipped to input bar height) */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  key="particles"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '3.25rem',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: 0,
                    borderRadius: 'inherit',
                  }}
                >
                  {particleConfigs.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        x: [0, p.xDelta, 0],
                        y: [0, p.yDelta, 0],
                        scale: [0, p.scale, 0],
                        opacity: [0, 0.6, 0],
                      }}
                      transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        repeatType: 'loop',
                        ease: 'easeInOut',
                      }}
                      style={{
                        position: 'absolute',
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: i % 2 === 0
                          ? 'rgba(244,114,182,0.85)'
                          : 'rgba(125,211,252,0.75)',
                        filter: 'blur(2px)',
                        left: p.left,
                        top: p.top,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Click ripple */}
            <AnimatePresence>
              {isClicked && (
                <motion.div
                  key={`ripple-${++rippleKeyRef.current}`}
                  initial={{ scale: 0, opacity: 0.55, x: clickOrigin.x, y: clickOrigin.y }}
                  animate={{ scale: 5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(244,114,182,0.55) 0%, rgba(99,102,241,0.2) 70%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    translateX: '-50%',
                    translateY: '-50%',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Input + clear button */}
            <div style={{ position: 'relative', width: '100%', flex: 1, zIndex: 2 }}>
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
                    setIsClicked(true);
                    window.setTimeout(() => setIsClicked(false), 700);
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
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    className="watchlist-top-controls__search-clear"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    whileHover={{ opacity: 1, scale: 1.15 }}
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedAutocompleteResult(null);
                      resetAutocomplete();
                      internalSearchInputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      translateY: "-50%",
                      background: "none",
                      border: "none",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                      zIndex: 3,
                    }}
                  >
                    ✕
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Autocomplete dropdown */}
            {isAutocompleteMounted && hasAutocompleteFeedback && (
              <motion.div
                id={autocompleteListId}
                className={`watchlist-top-controls__autocomplete${isAutocompleteOpen ? " is-open" : ""}`}
                role="listbox"
                aria-label="Movie and show suggestions"
                initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                animate={isAutocompleteOpen
                  ? { opacity: 1, y: 0, scaleY: 1 }
                  : { opacity: 0, y: -6, scaleY: 0.96 }
                }
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                style={{ transformOrigin: 'top center' }}
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
                    <motion.button
                      key={result.imdbID ?? `${result.title}-${index}`}
                      id={`${autocompleteListId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeAutocompleteIndex}
                      className={`watchlist-top-controls__autocomplete-option ${
                        index === activeAutocompleteIndex ? "is-active" : ""
                      }`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 20,
                        delay: index * 0.045,
                      }}
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
                    </motion.button>
                  ));
                })() : !isAutocompleteLoading ? (
                  <div className="watchlist-top-controls__autocomplete-status">
                    No titles found for &quot;{trimmedSearchQuery}&quot;
                  </div>
                ) : null}
              </motion.div>
            )}
          </motion.div>

          {/* ── Action buttons — slide in/out ──────────────────────────────────── */}
          <AnimatePresence>
            {hasSearchQuery && (
              <motion.div
                className="watchlist-top-controls__search-actions"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isAdding}
                  loadingText="Adding"
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
                  disabled={isBusy || !canRecommend}
                  title={isGuest ? 'Add a note for this suggestion' : 'Recommend movie'}
                  aria-label={isGuest ? 'Add a note for this suggestion' : 'Recommend movie'}
                  leftIcon={<PlusIcon />}
                >
                  {isGuest ? 'Add a note' : 'Recommend'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
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
        <div className="places-top-controls__error" role="alert">
          {suggestionError}
        </div>
      )}
    </>
  );
});

MoviesTopControls.displayName = 'MoviesTopControls';

export default MoviesTopControls;
