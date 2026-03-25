import type { PlaceContentTab, PlaceSortMode } from '@/shared/types';

export const PLACE_TABS: { id: PlaceContentTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'queue', label: 'Queue' },
  { id: 'visited', label: 'Visited' },
];

export const PLACE_SORT_OPTIONS: { id: PlaceSortMode; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'name', label: 'A-Z' },
];
