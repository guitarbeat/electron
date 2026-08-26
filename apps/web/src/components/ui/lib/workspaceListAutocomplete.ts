import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export function getNextListIndex(
  currentIndex: number,
  direction: "next" | "previous",
  resultCount: number,
): number {
  if (resultCount <= 0) {
    return -1;
  }

  if (direction === "next") {
    if (currentIndex < 0 || currentIndex >= resultCount - 1) {
      return 0;
    }

    return currentIndex + 1;
  }

  if (currentIndex <= 0) {
    return resultCount - 1;
  }

  return currentIndex - 1;
}

export function getListEnterSelectionIndex(
  activeIndex: number,
  resultCount: number,
): number {
  if (resultCount <= 0) {
    return -1;
  }

  if (activeIndex >= 0 && activeIndex < resultCount) {
    return activeIndex;
  }

  return 0;
}

export const useWorkspaceAutocompleteNavigation = () => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const resetActiveIndex = useCallback(() => setActiveIndex(-1), []);
  const moveActiveIndex = useCallback(
    (direction: "next" | "previous", resultCount: number) =>
      setActiveIndex((currentIndex) =>
        getNextListIndex(currentIndex, direction, resultCount),
      ),
    [],
  );
  const getEnterSelectionIndex = useCallback(
    (resultCount: number) =>
      getListEnterSelectionIndex(activeIndex, resultCount),
    [activeIndex],
  );

  return {
    activeIndex,
    setActiveIndex,
    resetActiveIndex,
    moveActiveIndex,
    getEnterSelectionIndex,
  };
};

export function useWorkspaceAutocompleteDismiss(
  regionRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!regionRef.current?.contains(target)) {
        onDismiss();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onDismiss, regionRef]);
}

interface AutocompleteFocusBoundaryOptions {
  shouldSkipClose?: () => boolean;
  onFocusStateChange?: (isFocused: boolean) => void;
}

export function useAutocompleteFocusBoundary(
  regionRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  options?: AutocompleteFocusBoundaryOptions,
) {
  const focusBoundaryFrameRef = useRef<number | null>(null);
  const shouldSkipClose = options?.shouldSkipClose;
  const onFocusStateChange = options?.onFocusStateChange;

  const clearFocusBoundaryCheck = useCallback(() => {
    if (focusBoundaryFrameRef.current !== null) {
      window.cancelAnimationFrame(focusBoundaryFrameRef.current);
      focusBoundaryFrameRef.current = null;
    }
  }, []);

  useEffect(() => () => clearFocusBoundaryCheck(), [clearFocusBoundaryCheck]);

  const onFocusCapture = useCallback(() => {
    clearFocusBoundaryCheck();
    onFocusStateChange?.(true);
  }, [clearFocusBoundaryCheck, onFocusStateChange]);

  const onBlurCapture = useCallback(() => {
    clearFocusBoundaryCheck();
    focusBoundaryFrameRef.current = window.requestAnimationFrame(() => {
      focusBoundaryFrameRef.current = null;
      if (shouldSkipClose?.()) {
        return;
      }
      const nextIsFocused = Boolean(
        regionRef.current?.contains(document.activeElement),
      );
      onFocusStateChange?.(nextIsFocused);
      if (!nextIsFocused) {
        onClose();
      }
    });
  }, [
    clearFocusBoundaryCheck,
    onClose,
    onFocusStateChange,
    shouldSkipClose,
    regionRef,
  ]);

  return { onFocusCapture, onBlurCapture, clearFocusBoundaryCheck };
}

export function useWorkspaceSearchInputHandle(
  inputRef: RefObject<HTMLInputElement | null>,
  onFocusInput?: () => void,
) {
  return useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    if (document.activeElement !== input) {
      input.focus();
    }
    onFocusInput?.();
  }, [inputRef, onFocusInput]);
}
