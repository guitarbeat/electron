/**
 * useUndoRedo Hook
 *
 * Generic hook for managing undo/redo history of state changes
 */

import { useState, useCallback, useRef, useEffect } from 'react';

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
  const isUndoRedoRef = useRef(false);

  const setState = useCallback((newState: T) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      setStateInternal(newState);
      return;
    }

    setStateInternal((_currentState) => {
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

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const newPast = [...prevPast];
      const previousState = newPast.pop()!;

      setFuture((prevFuture) => {
        setStateInternal((_currentState) => {
          isUndoRedoRef.current = true;
          return previousState;
        });
        return [state, ...prevFuture];
      });

      return newPast;
    });
  }, [state]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const [nextState, ...newFuture] = prevFuture;

      setPast((prevPast) => {
        setStateInternal((_currentState) => {
          isUndoRedoRef.current = true;
          return nextState;
        });
        return [...prevPast, state];
      });

      return newFuture;
    });
  }, [state]);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  const reset = useCallback((newInitialState: T) => {
    setStateInternal(newInitialState);
    setPast([]);
    setFuture([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
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
