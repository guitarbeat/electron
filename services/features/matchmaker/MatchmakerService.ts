import { BaseGistService } from './BaseGistService.ts';
import { GIST_MATCHMAKER_FILENAME } from '../../config/gistConfig.ts';
import type { MatchmakerGame } from '../../types.ts';

export class MatchmakerService extends BaseGistService<MatchmakerGame | null> {
  constructor() {
    super({
      filename: GIST_MATCHMAKER_FILENAME,
      cacheTTL: 0, // No caching for real-time game state
      enableETag: false, // Disable ETag for immediate updates
    });
  }

  protected parseData(content: string): MatchmakerGame | null {
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Error parsing matchmaker JSON:', e);
      return null;
    }
  }

  protected serializeData(data: MatchmakerGame | null): string {
    return data ? JSON.stringify(data, null, 2) : '';
  }

  protected validateData(data: MatchmakerGame | null): boolean {
    return data === null || (typeof data === 'object' && data !== null);
  }

  protected getEmptyValue(): MatchmakerGame | null {
    return null;
  }
}

// Singleton instance
export const matchmakerService = new MatchmakerService();

// Export functions for backward compatibility
export const getMatchmakerGame = () => matchmakerService.fetch();
export const saveMatchmakerGame = (game: MatchmakerGame | null) => matchmakerService.save(game);
