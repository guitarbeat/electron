/**
 * Enhanced Workflow Hooks
 * Provides React hooks for managing workflows with improved error handling,
 * performance optimization, and user experience.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { workflowManager } from '../services/workflow/WorkflowManager';
import {
  userFlowOrchestrator,
  type UserFlowState,
} from '../services/workflow/UserFlowOrchestrator';
import type { User, Movie, MatchmakerGame } from '../types';

/**
 * Hook for managing data workflows with automatic retry and error handling
 */
export function useWorkflow<T>(
  workflowId: string,
  fetchFn: () => Promise<T>,
  options: {
    interval?: number;
    immediate?: boolean;
    maxRetries?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const cleanupRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const { interval, immediate } = optionsRef.current;

    setIsLoading(true);
    setError(null);

    cleanupRef.current = workflowManager.initializeWorkflow(
      workflowId,
      fetchFn,
      (newData, newError) => {
        if (newError) {
          setError(newError);
          setData(null);
          setIsLoading(false);
          optionsRef.current.onError?.(newError);
        } else {
          setData(newData);
          setError(null);
          setIsLoading(false);
          setRetryCount(0);
          optionsRef.current.onSuccess?.(newData);
        }
      },
      {
        interval,
        immediate,
      }
    );

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [workflowId, fetchFn]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await workflowManager.refreshWorkflow(workflowId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
      setIsLoading(false);
    }
  }, [workflowId]);

  const retry = useCallback(async () => {
    setRetryCount((prev) => prev + 1);
    await refresh();
  }, [refresh]);

  const workflowState = workflowManager.getWorkflowState(workflowId);

  return {
    data,
    error,
    isLoading,
    retryCount,
    refresh,
    retry,
    workflowState,
  };
}

/**
 * Hook for managing user flows with step-by-step navigation
 */
export function useUserFlow(flowId: string) {
  const [flowState, setFlowState] = useState<UserFlowState | null>(null);
  const [isFlowActive, setIsFlowActive] = useState(false);

  const startFlow = useCallback(
    (initialData: Record<string, any> = {}) => {
      try {
        const state = userFlowOrchestrator.startFlow(flowId, initialData);
        setFlowState(state);
        setIsFlowActive(true);
        return state;
      } catch (error) {
        console.error('Failed to start flow:', error);
        throw error;
      }
    },
    [flowId]
  );

  const nextStep = useCallback(
    async (stepData: any = {}) => {
      if (!flowState) return;

      try {
        const newState = userFlowOrchestrator.nextStep(flowId, stepData);
        setFlowState(newState);

        if (newState.isCompleted) {
          setIsFlowActive(false);
        }

        return newState;
      } catch (error) {
        console.error('Failed to advance step:', error);
        throw error;
      }
    },
    [flowId, flowState]
  );

  const previousStep = useCallback(() => {
    if (!flowState) return;

    try {
      const newState = userFlowOrchestrator.previousStep(flowId);
      setFlowState(newState);
      return newState;
    } catch (error) {
      console.error('Failed to go back:', error);
      throw error;
    }
  }, [flowId, flowState]);

  const skipStep = useCallback(() => {
    if (!flowState) return;

    try {
      const newState = userFlowOrchestrator.skipStep(flowId);
      setFlowState(newState);
      return newState;
    } catch (error) {
      console.error('Failed to skip step:', error);
      throw error;
    }
  }, [flowId, flowState]);

  const abortFlow = useCallback(() => {
    userFlowOrchestrator.abortFlow(flowId);
    setFlowState(null);
    setIsFlowActive(false);
  }, [flowId]);

  const handleError = useCallback(
    (error: string) => {
      userFlowOrchestrator.handleFlowError(flowId, error);
    },
    [flowId]
  );

  return {
    flowState,
    isFlowActive,
    startFlow,
    nextStep,
    previousStep,
    skipStep,
    abortFlow,
    handleError,
  };
}

/**
 * Hook for managing movie data workflow
 */
export function useMovieWorkflow(currentUser: User | null) {
  return useWorkflow<Movie[]>(
    `movies-${currentUser || 'anonymous'}`,
    async () => {
      // Import dynamically to avoid circular dependencies
      const { getMovies } = await import('../services/movieService');
      return getMovies();
    },
    {
      interval: 10000, // 10 seconds for movies
      immediate: true,
      onError: (error) => {
        console.error('Movie workflow error:', error);
      },
    }
  );
}

/**
 * Hook for managing matchmaker workflow
 */
export function useMatchmakerWorkflow(currentUser: User | null) {
  return useWorkflow<MatchmakerGame>(
    `matchmaker-${currentUser || 'anonymous'}`,
    async () => {
      // Import dynamically to avoid circular dependencies
      const { getMatchmakerGame } = await import('../services/matchmakerService');
      return getMatchmakerGame();
    },
    {
      interval: 5000, // 5 seconds for real-time matchmaker
      immediate: true,
      onError: (error) => {
        console.error('Matchmaker workflow error:', error);
      },
    }
  );
}

/**
 * Hook for managing memory workflow
 */
export function useMemoryWorkflow(currentUser: User | null) {
  return useWorkflow(
    `memories-${currentUser || 'anonymous'}`,
    async () => {
      // Import dynamically to avoid circular dependencies
      const { getMemories } = await import('../services/memoryService');
      return getMemories();
    },
    {
      interval: 15000, // 15 seconds for memories
      immediate: true,
      onError: (error) => {
        console.error('Memory workflow error:', error);
      },
    }
  );
}

/**
 * Hook for workflow performance monitoring
 */
export function useWorkflowMetrics() {
  const [metrics, setMetrics] = useState(() => workflowManager.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(workflowManager.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}
