import { useState, useRef, useEffect } from 'react';
import { useMediaQuery, breakpoints } from '../../../hooks/useMediaQuery';
import { ALL_MOVIES_FILTER } from '../../memories/memoryUtils';
import { SortMode, ContentTab } from '../types';
import { Movie } from '../../../types';

const MEMORY_FILTER_STORAGE_KEY = 'queueMemoryFilter';

export const useWatchlistState = () => {
  const isMobile = useMediaQuery(breakpoints.sm);

  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'dial'>('grid');
  const [contentTab, setContentTab] = useState<ContentTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [movieToFix, setMovieToFix] = useState<Movie | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeMemoryFilter, setActiveMemoryFilter] = useState(ALL_MOVIES_FILTER);
  const [showMemoriesOnly, setShowMemoriesOnly] = useState(false);
  const [isMemoryWallCollapsed, setIsMemoryWallCollapsed] = useState(isMobile);
  const [highlightMovieId, setHighlightMovieId] = useState<string | null>(null);

  const previousMoviesRef = useRef<Movie[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const memorySectionRef = useRef<HTMLDivElement | null>(null);
  const movieResultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMemoryWallCollapsed(isMobile);
  }, [isMobile]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlFilter = searchParams.get('memoryFilter');
    const savedFilter = localStorage.getItem(MEMORY_FILTER_STORAGE_KEY);
    const initialFilter = urlFilter || savedFilter || ALL_MOVIES_FILTER;
    setActiveMemoryFilter(initialFilter);
  }, []);

  useEffect(() => {
    localStorage.setItem(MEMORY_FILTER_STORAGE_KEY, activeMemoryFilter);
    const url = new URL(window.location.href);
    if (activeMemoryFilter === ALL_MOVIES_FILTER) {
      url.searchParams.delete('memoryFilter');
    } else {
      url.searchParams.set('memoryFilter', activeMemoryFilter);
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeMemoryFilter]);

  useEffect(() => {
    if (activeMemoryFilter !== ALL_MOVIES_FILTER) {
      setIsMemoryWallCollapsed(false);
    }
  }, [activeMemoryFilter]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return {
    isMobile,
    newMovieTitle,
    setNewMovieTitle,
    isAdding,
    setIsAdding,
    movieToDelete,
    setMovieToDelete,
    toast,
    setToast,
    successMovieId,
    setSuccessMovieId,
    processingSuggestionId,
    setProcessingSuggestionId,
    viewMode,
    setViewMode,
    contentTab,
    setContentTab,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    movieToFix,
    setMovieToFix,
    showConfetti,
    setShowConfetti,
    activeMemoryFilter,
    setActiveMemoryFilter,
    showMemoriesOnly,
    setShowMemoriesOnly,
    isMemoryWallCollapsed,
    setIsMemoryWallCollapsed,
    highlightMovieId,
    setHighlightMovieId,
    previousMoviesRef,
    inputRef,
    memorySectionRef,
    movieResultsRef,
  };
};
