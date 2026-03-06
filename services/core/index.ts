// Core service exports
export { BaseGistService } from './BaseGistService.ts';
export type { CacheEntry, GistServiceOptions } from './BaseGistService.ts';

// Consolidated services
export { 
  MatchmakerService, 
  matchmakerService, 
  getMatchmakerGame, 
  saveMatchmakerGame 
} from './MatchmakerService.ts';

export { 
  MovieService, 
  movieService, 
  getMovies, 
  saveMovies 
} from './MovieService.ts';

// Unified polling
export { 
  unifiedPollingManager 
} from './UnifiedPollingManager.ts';

// Re-export existing gist client for compatibility
export * from '../gistClient.ts';
