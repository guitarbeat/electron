import { useCallback, useEffect, useRef, type RefObject } from "react";

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
  /** Skip blur close while a dropdown interaction is finishing (e.g. pointer-down on panel). */
  shouldSkipClose?: () => boolean;
  /** Called when the search region gains or loses focus. */
  onFocusStateChange?: (isFocused: boolean) => void;
}

export function useAutocompleteFocusBoundary(
  regionRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  options?: AutocompleteFocusBoundaryOptions,
) {
  const focusBoundaryFrameRef = useRef<number | null>(null);

  const clearFocusBoundaryCheck = useCallback(() => {
    if (focusBoundaryFrameRef.current !== null) {
      window.cancelAnimationFrame(focusBoundaryFrameRef.current);
      focusBoundaryFrameRef.current = null;
    }
  }, []);

  useEffect(() => () => clearFocusBoundaryCheck(), [clearFocusBoundaryCheck]);

  const onFocusCapture = useCallback(() => {
    clearFocusBoundaryCheck();
    options?.onFocusStateChange?.(true);
  }, [clearFocusBoundaryCheck, options?.onFocusStateChange]);

  const onBlurCapture = useCallback(() => {
    clearFocusBoundaryCheck();
    focusBoundaryFrameRef.current = window.requestAnimationFrame(() => {
      focusBoundaryFrameRef.current = null;
      if (options?.shouldSkipClose?.()) {
        return;
      }
      const nextIsFocused = Boolean(
        regionRef.current?.contains(document.activeElement),
      );
      options?.onFocusStateChange?.(nextIsFocused);
      if (!nextIsFocused) {
        onClose();
      }
    });
  }, [
    clearFocusBoundaryCheck,
    onClose,
    options?.onFocusStateChange,
    options?.shouldSkipClose,
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
