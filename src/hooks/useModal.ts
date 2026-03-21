import { useEffect, useRef } from 'react';
import { isFocusWithin, trapFocusOnTab } from '@/components/ui/modalPrimitives';

interface UseModalOptions {
  isOpen: boolean;
  onClose?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
  closeDisabled?: boolean;
}

interface UseModalReturn {
  dialogRef: React.RefObject<HTMLDivElement | null>;
  previousFocusedElement: React.RefObject<HTMLElement | null>;
  hadModalOpenClassRef: React.RefObject<boolean>;
}

export const useModal = ({ 
  isOpen, 
  onClose, 
  initialFocusRef, 
  closeDisabled = false 
}: UseModalOptions): UseModalReturn => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusedElement = useRef<HTMLElement | null>(null);
  const hadModalOpenClassRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      previousFocusedElement.current?.focus?.();
      return undefined;
    }

    previousFocusedElement.current = document.activeElement as HTMLElement;
    hadModalOpenClassRef.current = document.body.classList.contains('modal-open');
    document.body.classList.add('modal-open');

    // Set initial focus
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFocusWithin(dialogRef.current)) {
          event.preventDefault();
          if (!closeDisabled) {
            onClose?.();
          }
        }
      }
      if (event.key === 'Tab' && dialogRef.current) {
        trapFocusOnTab(event, dialogRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (!hadModalOpenClassRef.current) {
        document.body.classList.remove('modal-open');
      }
    };
  }, [isOpen, onClose, initialFocusRef, closeDisabled]);

  return { dialogRef, previousFocusedElement, hadModalOpenClassRef };
};
