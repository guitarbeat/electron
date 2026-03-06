export type ContentTab = 'all' | 'to-watch' | 'watched' | 'suggestions';
export type SortMode = 'recent' | 'title' | 'year';

export interface WatchlistProps {
  isPaused?: boolean;
}
