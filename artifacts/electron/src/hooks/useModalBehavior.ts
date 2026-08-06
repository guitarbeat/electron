import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  isFocusWithin,
  trapFocusOnTab,
} from "@/components/ui/lib/modalPrimitives";
import { useAudio } from "./useAudio";

export interface UseModalBehaviorOptions {
  isOpen: boolean;
  onClose: () => void;
  closeDisabled?: boolean;
  /** Ref to the modal/sheet container. Used for focus trap and Escape guard. */
  containerRef: RefObject<HTMLElement | null>;
  /** Ref to the element that should receive initial focus (e.g. close button). */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Shared modal behavior:
 *   - Locks body scroll while open and restores it on close.
 *   - Saves and restores the previously focused element.
 *   - Moves initial focus to `initialFocusRef` (or the container when close is disabled).
 *   - Traps Tab focus within the container.
 *   - Closes on Escape (unless `closeDisabled`).
 *
 * Returns `handleClose` — plays the pop sound and guards against the disabled state.
 */
export const useModalBehavior = ({
  isOpen,
  onClose,
  closeDisabled = false,
  containerRef,
  initialFocusRef,
}: UseModalBehaviorOptions) => {
  const { playPop } = useAudio();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      previousFocusRef.current?.focus?.();
      return undefined;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      if (closeDisabled) {
        containerRef.current?.focus();
      } else {
        (initialFocusRef?.current ?? containerRef.current)?.focus();
      }
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusWithin(containerRef.current)) return;
      const isTextInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;
      const isBackKey =
        event.key === "Escape" ||
        event.key === "GoBack" ||
        event.keyCode === 10009 ||
        event.keyCode === 461 ||
        (event.key === "Backspace" && !isTextInput);

      if (isBackKey && !closeDisabled) {
        event.preventDefault();
        onClose();
        return;
      }
      trapFocusOnTab(event, containerRef.current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDisabled, onClose, containerRef, initialFocusRef]);

  const handleClose = useCallback(() => {
    if (closeDisabled) return;
    playPop();
    onClose();
  }, [closeDisabled, onClose, playPop]);

  return { handleClose };
};
