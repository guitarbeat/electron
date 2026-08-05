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
  const wasOpenRef = useRef(false);

  // Store onClose and closeDisabled in refs so the effect only depends on
  // `isOpen`. This prevents the scroll-lock effect from tearing down and
  // recapturing `prevOverflow` (as "hidden") when callers pass unstable
  // onClose references.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeDisabledRef = useRef(closeDisabled);
  closeDisabledRef.current = closeDisabled;

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        const el = previousFocusRef.current;
        if (el && document.contains(el)) {
          el.focus();
        }
      }
      wasOpenRef.current = false;
      return undefined;
    }

    wasOpenRef.current = true;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      if (closeDisabledRef.current) {
        containerRef.current?.focus();
      } else {
        (initialFocusRef?.current ?? containerRef.current)?.focus();
      }
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusWithin(containerRef.current)) return;
      if (event.key === "Escape" && !closeDisabledRef.current) {
        event.preventDefault();
        onCloseRef.current();
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
  }, [isOpen, containerRef, initialFocusRef]);

  const handleClose = useCallback(() => {
    if (closeDisabled) return;
    playPop();
    onClose();
  }, [closeDisabled, onClose, playPop]);

  return { handleClose };
};
