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

export function useAutocompleteFocusBoundary(
  regionRef: RefObject<HTMLElement | null>,
  onClose: () => void,
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
  }, [clearFocusBoundaryCheck]);

  const onBlurCapture = useCallback(() => {
    clearFocusBoundaryCheck();
    focusBoundaryFrameRef.current = window.requestAnimationFrame(() => {
      focusBoundaryFrameRef.current = null;
      const nextIsFocused = Boolean(
        regionRef.current?.contains(document.activeElement),
      );
      if (!nextIsFocused) {
        onClose();
      }
    });
  }, [clearFocusBoundaryCheck, onClose, regionRef]);

  return { onFocusCapture, onBlurCapture, clearFocusBoundaryCheck };
}
