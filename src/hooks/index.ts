/**
 * Consolidated Hooks
 * Combines small utility hooks
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSyncExternalStore, useCallback as useCallbackReact } from 'react';
import { useState, useCallback as useCallbackState, useRef as useRefState, useEffect as useEffectState } from 'react';

// ============================================================================
// useAudio Hook
// ============================================================================

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    return () => {
      // Keep it alive for the session usually, but we can close on unmount if needed
      // For a global hook used in many places, maybe don't close immediately
    };
  }, []);

  const playTone = useCallback(
    (frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        } else {
          return;
        }
      }

      const ctx = audioContextRef.current;

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    []
  );

  const playClick = useCallback(() => {
    playTone(800, 'sine', 0.05, 0.05);
  }, [playTone]);

  const playPop = useCallback(() => {
    playTone(400, 'sine', 0.1, 0.08);
  }, [playTone]);

  const playSwitch = useCallback(() => {
    playTone(600, 'triangle', 0.08, 0.04);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    playTone(523.25, 'sine', 0.1, 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.2, 0.1), 100); // E5
  }, [playTone]);

  return { playTone, playClick, playPop, playSwitch, playSuccess };
};

// ============================================================================
// useMediaQuery Hook
// ============================================================================

/**
 * Custom hook to detect if a media query matches.
 * Useful for handling responsive logic in components using inline styles.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallbackReact(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(query);
      matchMedia.addEventListener('change', callback);
      return () => {
        matchMedia.removeEventListener('change', callback);
      };
    },
    [query]
  );

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => {
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Common breakpoints used in the design system.
 */
export const breakpoints = {
  sm: '(max-width: 640px)',
  md: '(max-width: 768px)',
  lg: '(max-width: 1024px)',
  xl: '(max-width: 1280px)',
};

// ============================================================================
// useUndoRedo Hook
// ============================================================================

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  reset: (initialState: T) => void;
}

const MAX_HISTORY_SIZE = 20;

export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  const [state, setStateInternal] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const isUndoRedoRef = useRefState(false);

  const setState = useCallbackState((newState: T) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      setStateInternal(newState);
      return;
    }

    setStateInternal((currentState) => {
      setPast((prevPast) => {
        const newPast = [...prevPast, currentState];
        // Limit history size
        if (newPast.length > MAX_HISTORY_SIZE) {
          return newPast.slice(newPast.length - MAX_HISTORY_SIZE);
        }
        return newPast;
      });
      setFuture([]);
      return newState;
    });
  }, []);

  const undo = useCallbackState(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const newPast = [...prevPast];
      const previousState = newPast.pop()!;

      setFuture((prevFuture) => {
        setStateInternal((currentState) => {
          isUndoRedoRef.current = true;
          return previousState;
        });
        return [state, ...prevFuture];
      });

      return newPast;
    });
  }, [state]);

  const redo = useCallbackState(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const [nextState, ...newFuture] = prevFuture;

      setPast((prevPast) => {
        setStateInternal((currentState) => {
          isUndoRedoRef.current = true;
          return nextState;
        });
        return [...prevPast, state];
      });

      return newFuture;
    });
  }, [state]);

  const clear = useCallbackState(() => {
    setPast([]);
    setFuture([]);
  }, []);

  const reset = useCallbackState((newInitialState: T) => {
    setStateInternal(newInitialState);
    setPast([]);
    setFuture([]);
  }, []);

  // Keyboard shortcuts
  useEffectState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clear,
    reset,
  };
}