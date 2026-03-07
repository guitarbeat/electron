/**
 * Enhanced Matchmaker Hook
 * Improves the matchmaker workflow with better error handling, performance optimization,
 * and enhanced user experience features.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWorkflow } from './useWorkflow';
import { useUserFlow } from './useWorkflow';
import type { User, MatchmakerGame, Movie } from '../../types';

interface UseEnhancedMatchmakerOptions {
  onMatchFound?: (movie: Movie) => void;
  onGameComplete?: (matches: Movie[]) => void;
  enableAnimations?: boolean;
  autoRetry?: boolean;
}

export function useEnhancedMatchmaker(
  currentUser: User | null,
  options: UseEnhancedMatchmakerOptions = {}
) {
  const { onMatchFound, onGameComplete, autoRetry } = options;
  const [game, setGame] = useState<MatchmakerGame | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [lastMatchedMovie, setLastMatchedMovie] = useState<Movie | null>(null);
  
  const submissionLockRef = useRef<Promise<void> | null>(null);
  const previousMatchesRef = useRef<string[]>([]);

  // Use enhanced workflow for data management
  const { 
    data: workflowData, 
    error, 
    isLoading, 
    retry,
    workflowState 
  } = useWorkflow<MatchmakerGame>(
    `matchmaker-${currentUser || 'anonymous'}`,
    async () => {
      const { getMatchmakerGame } = await import('../services/matchmakerService');
      return getMatchmakerGame();
    },
    {
      interval: 5000,
      immediate: true,
      onSuccess: (data) => {
        setGame(data);
        checkForNewMatches(data);
      },
      onError: (error) => {
        console.error('Matchmaker workflow error:', error);
        if (autoRetry && workflowState?.retryCount < 3) {
          setTimeout(retry, 2000);
        }
      },
    }
  );

  // Use user flow for matchmaker game flow
  const { flowState, startFlow, nextStep, abortFlow } = useUserFlow('matchmaker-game');

  // Check for new matches and trigger animations
  const checkForNewMatches = useCallback((currentGame: MatchmakerGame | null) => {
    if (!currentGame || !currentUser) return;

    const currentMatches = currentGame.aaronLikes.filter(id => 
      currentGame.electraLikes.includes(id)
    );
    
    const previousMatches = previousMatchesRef.current;
    const newMatches = currentMatches.filter(id => !previousMatches.includes(id));

    if (newMatches.length > 0) {
      // Get movie details for the new match
      const getMovieDetails = async () => {
        try {
          const { getMovies } = await import('../services/movieService');
          const movies = await getMovies();
          const matchedMovie = movies.find(m => m.id === newMatches[0]);
          
          if (matchedMovie) {
            setLastMatchedMovie(matchedMovie);
            setMatchAnimation(true);
            onMatchFound?.(matchedMovie);
            
            // Reset animation after duration
            setTimeout(() => {
              setMatchAnimation(false);
              setLastMatchedMovie(null);
            }, 4000);
          }
        } catch (error) {
          console.error('Error fetching movie details:', error);
        }
      };

      getMovieDetails();
    }

    previousMatchesRef.current = currentMatches;
  }, [currentUser, onMatchFound]);

  // Enhanced mutation with better error handling and retry logic
  const performMutation = useCallback(
    async (mutationFn: (latestGame: MatchmakerGame | null) => MatchmakerGame | null) => {
      if (!currentUser) return;

      const mutation = (async () => {
        try {
          await submissionLockRef.current;
        } catch (e) {
          // Ignore previous errors
        }

        setIsSubmitting(true);
        try {
          const { getMatchmakerGame, saveMatchmakerGame } = await import('../services/matchmakerService');
          const latestGame = await getMatchmakerGame();
          const updatedGame = mutationFn(latestGame);
          await saveMatchmakerGame(updatedGame);
          retry(); // Refresh the workflow data
        } catch (err) {
          console.error('Matchmaker mutation failed:', err);
          throw err;
        } finally {
          setIsSubmitting(false);
        }
      })();

      submissionLockRef.current = mutation;
      await mutation;
    },
    [currentUser, retry]
  );

  // Start new game with enhanced flow management
  const startNewGame = useCallback(
    async (movieIds: string[], selectedVibe?: string) => {
      if (!currentUser) return;

      // Start user flow if not already active
      if (!flowState?.isFlowActive) {
        startFlow({ vibe: selectedVibe });
      }

      const newGame: MatchmakerGame = {
        id: crypto.randomUUID(),
        moviePool: movieIds,
        aaronLikes: [],
        electraLikes: [],
        aaronDislikes: [],
        electraDislikes: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        startedBy: currentUser,
      };

      await performMutation(() => newGame);
      await nextStep({ moviePool: movieIds });
    },
    [currentUser, performMutation, flowState, startFlow, nextStep]
  );

  // Helper function to get matches from game
  const getMatchesFromGame = useCallback((currentGame: MatchmakerGame): Movie[] => {
    const matchIds = currentGame.aaronLikes.filter((id) => currentGame.electraLikes.includes(id));
    // This would need to be enhanced to fetch actual movie data
    return [];
  }, []);

  // Enhanced swipe with better state management
  const swipe = useCallback(
    async (movieId: string, liked: boolean) => {
      if (!currentUser) return;

      await performMutation((latestGame) => {
        if (!latestGame || latestGame.status !== 'active') return latestGame;

        const updatedGame = {
          ...latestGame,
          aaronLikes: latestGame.aaronLikes || [],
          electraLikes: latestGame.electraLikes || [],
          aaronDislikes: latestGame.aaronDislikes || [],
          electraDislikes: latestGame.electraDislikes || [],
        };

        const userLikes = currentUser === 'Aaron' ? updatedGame.aaronLikes : updatedGame.electraLikes;
        const userDislikes = currentUser === 'Aaron' ? updatedGame.aaronDislikes : updatedGame.electraDislikes;

        if (liked) {
          if (!userLikes.includes(movieId) && !userDislikes.includes(movieId)) {
            if (currentUser === 'Aaron') {
              updatedGame.aaronLikes = [...userLikes, movieId];
            } else {
              updatedGame.electraLikes = [...userLikes, movieId];
            }
          }
        } else if (!userDislikes.includes(movieId) && !userLikes.includes(movieId)) {
          if (currentUser === 'Aaron') {
            updatedGame.aaronDislikes = [...userDislikes, movieId];
          } else {
            updatedGame.electraDislikes = [...userDislikes, movieId];
          }
        }

        // Check if game is complete
        const totalSwipes = updatedGame.aaronLikes.length + updatedGame.aaronDislikes.length +
                           updatedGame.electraLikes.length + updatedGame.electraDislikes.length;
        
        if (totalSwipes >= updatedGame.moviePool.length * 2) {
          updatedGame.status = 'completed';
          onGameComplete?.(getMatchesFromGame(updatedGame));
        }

        return updatedGame;
      });
    },
    [currentUser, getMatchesFromGame, onGameComplete, performMutation]
  );

  // Enhanced undo with better validation
  const undo = useCallback(async () => {
    if (!currentUser) return;

    await performMutation((latestGame) => {
      if (!latestGame || latestGame.status !== 'active') return latestGame;

      const updatedGame = {
        ...latestGame,
        aaronLikes: latestGame.aaronLikes || [],
        electraLikes: latestGame.electraLikes || [],
        aaronDislikes: latestGame.aaronDislikes || [],
        electraDislikes: latestGame.electraDislikes || [],
      };

      const userLikes = currentUser === 'Aaron' ? updatedGame.aaronLikes : updatedGame.electraLikes;
      const userDislikes = currentUser === 'Aaron' ? updatedGame.aaronDislikes : updatedGame.electraDislikes;
      const userSwipedIds = [...userLikes, ...userDislikes];

      if (userSwipedIds.length === 0) return updatedGame;

      const poolInReverse = [...updatedGame.moviePool].reverse();
      const lastSwipedId = poolInReverse.find(id => userSwipedIds.includes(id));

      if (lastSwipedId) {
        if (currentUser === 'Aaron') {
          updatedGame.aaronLikes = updatedGame.aaronLikes.filter(id => id !== lastSwipedId);
          updatedGame.aaronDislikes = updatedGame.aaronDislikes.filter(id => id !== lastSwipedId);
        } else {
          updatedGame.electraLikes = updatedGame.electraLikes.filter(id => id !== lastSwipedId);
          updatedGame.electraDislikes = updatedGame.electraDislikes.filter(id => id !== lastSwipedId);
        }
      }

      return updatedGame;
    });
  }, [currentUser, performMutation]);

  // End current game with cleanup
  const endCurrentGame = useCallback(async () => {
    await performMutation(() => null);
    abortFlow();
    previousMatchesRef.current = [];
    setLastMatchedMovie(null);
    setMatchAnimation(false);
  }, [performMutation, abortFlow]);

  // Get current matches from game
  const matches = game ? game.aaronLikes.filter(id => game.electraLikes.includes(id)) : [];

  // Get remaining movies for current user
  const getRemainingMovies = useCallback((allMovies: Movie[]): Movie[] => {
    if (!game) return [];

    const userLikes = currentUser === 'Aaron' ? game.aaronLikes : game.electraLikes;
    const userDislikes = currentUser === 'Aaron' ? game.aaronDislikes : game.electraDislikes;
    const swipedIds = [...userLikes, ...userDislikes];

    return game.moviePool
      .map(id => allMovies.find(m => m.id === id))
      .filter((m): m is Movie => !!m && !swipedIds.includes(m.id));
  }, [game, currentUser]);

  return {
    // State
    game,
    isLoading,
    error,
    isSubmitting,
    workflowState,
    flowState,
    
    // Match state
    matches,
    matchAnimation,
    lastMatchedMovie,
    
    // Actions
    startNewGame,
    swipe,
    undo,
    endCurrentGame,
    retry,
    
    // Helpers
    getRemainingMovies,
    getMatchesFromGame,
    
    // Flow management
    isFlowActive: flowState?.isFlowActive || false,
    currentStep: flowState?.step || 0,
  };
}
