/**
 * Consolidated Matchmaker Service using BaseService pattern
 * Replaces legacy matchmakerService.ts with improved architecture
 */

import { BaseService } from '../core/BaseService.ts';
import { gitHubClient } from '../core/GitHubClient.ts';
import { GIST_TOKEN } from '../../config/gistConfig.ts';

export interface MatchmakerGame {
  status: 'active' | 'completed';
  movies: string[];
  aaronLikes: string[];
  aaronDislikes: string[];
  electraLikes: string[];
  electraDislikes: string[];
  currentMovie?: string;
  createdAt?: number;
  completedAt?: number;
}

export class MatchmakerService extends BaseService<MatchmakerGame | null> {
  private static readonly GIST_MATCHMAKER_FILENAME = 'matchmaker.json';

  constructor() {
    super(MatchmakerService.GIST_MATCHMAKER_FILENAME, 2 * 60 * 1000); // 2 minutes TTL for real-time updates
  }

  protected parseContent(content: string | undefined): MatchmakerGame | null {
    if (!content) {
      return null;
    }

    try {
      const game = JSON.parse(content);
      // Validate game structure
      if (!game.status || !Array.isArray(game.movies)) {
        console.warn('Invalid matchmaker game structure, returning null');
        return null;
      }
      return game as MatchmakerGame;
    } catch (parseError) {
      console.error('Error parsing matchmaker game:', parseError);
      return null;
    }
  }

  protected serializeData(data: MatchmakerGame | null): string {
    return data ? JSON.stringify(data, null, 2) : '{}';
  }

  /**
   * Fetch matchmaker game state
   */
  async getMatchmakerGame(): Promise<MatchmakerGame | null> {
    return this.fetch();
  }

  /**
   * Save matchmaker game state
   */
  async saveMatchmakerGame(game: MatchmakerGame | null): Promise<void> {
    if (!game) {
      // Clear the game by saving empty content
      const response = await gitHubClient.patchGistFile({
        token: GIST_TOKEN,
        filename: MatchmakerService.GIST_MATCHMAKER_FILENAME,
        content: '{}',
      });

      if (!response.ok) {
        const errorMessage = await gitHubClient.buildErrorMessage(response);
        throw new Error(errorMessage);
      }

      this.cache.clear();
      return;
    }

    await this.save(game);
  }

  /**
   * Apply user swipe to game state
   */
  async applySwipe(
    game: MatchmakerGame | null,
    user: 'Aaron' | 'Electra',
    movieId: string,
    liked: boolean
  ): Promise<MatchmakerGame> {
    if (!game) {
      throw new Error('No active game to apply swipe to');
    }

    const updatedGame = { ...game };

    if (user === 'Aaron') {
      if (liked) {
        if (!updatedGame.aaronLikes.includes(movieId) && !updatedGame.aaronDislikes.includes(movieId)) {
          updatedGame.aaronLikes.push(movieId);
        }
      } else {
        if (!updatedGame.aaronLikes.includes(movieId) && !updatedGame.aaronDislikes.includes(movieId)) {
          updatedGame.aaronDislikes.push(movieId);
        }
      }
    } else {
      if (liked) {
        if (!updatedGame.electraLikes.includes(movieId) && !updatedGame.electraDislikes.includes(movieId)) {
          updatedGame.electraLikes.push(movieId);
        }
      } else {
        if (!updatedGame.electraLikes.includes(movieId) && !updatedGame.electraDislikes.includes(movieId)) {
          updatedGame.electraDislikes.push(movieId);
        }
      }
    }

    return updatedGame;
  }

  /**
   * Get next movie for user to swipe
   */
  getNextMovie(game: MatchmakerGame | null, user: 'Aaron' | 'Electra'): string | null {
    if (!game || game.status !== 'active') {
      return null;
    }

    const userLikes = user === 'Aaron' ? game.aaronLikes : game.electraLikes;
    const userDislikes = user === 'Aaron' ? game.aaronDislikes : game.electraDislikes;
    const swipedMovies = new Set([...userLikes, ...userDislikes]);

    // Find first movie that hasn't been swiped by this user
    for (const movieId of game.movies) {
      if (!swipedMovies.has(movieId)) {
        return movieId;
      }
    }

    return null;
  }

  /**
   * Check if game is complete (both users have swiped all movies)
   */
  isGameComplete(game: MatchmakerGame | null): boolean {
    if (!game) return false;

    const aaronSwiped = new Set([...game.aaronLikes, ...game.aaronDislikes]);
    const electraSwiped = new Set([...game.electraLikes, ...game.electraDislikes]);

    return game.movies.every(movieId => 
      aaronSwiped.has(movieId) && electraSwiped.has(movieId)
    );
  }
}

// Export singleton instance
export const matchmakerService = new MatchmakerService();
