import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  colors,
  radius,
  spacing,
  typography,
  zIndex,
  shadows,
  motion,
} from '@/design-system';
import {
  getModalCloseButtonStyle,
  getModalOverlayStyle,
  isFocusWithin,
  trapFocusOnTab,
} from '../modalPrimitives';
import { useAudio } from '@/hooks/useAudio';
import Card from '../Card';
import Button from '../Button';

// Base modal hook for shared functionality
const useModalBase = (isOpen: boolean, onClose?: () => void) => {
  const { playPop } = useAudio();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFocusWithin(dialogRef.current)) {
        event.preventDefault();
        onClose?.();
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
  }, [isOpen, onClose]);

  return { dialogRef, closeButtonRef, previousFocusedElement, playPop };
};

// Unified Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  maxWidth?: number;
  maxHeight?: number;
  closeDisabled?: boolean;
  closeDisabledLabel?: string;
  variant?: 'centered' | 'bottom-sheet';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  ariaLabel = 'Dialog',
  maxWidth = 520,
  maxHeight = 720,
  closeDisabled = false,
  closeDisabledLabel = 'Please wait for the current action to finish.',
  variant = 'centered',
}) => {
  const { dialogRef, closeButtonRef, playPop } = useModalBase(isOpen, onClose);

  if (!isOpen) return null;

  const isBottomSheet = variant === 'bottom-sheet';
  
  const modalStyle = isBottomSheet ? {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: '100%',
    maxHeight: '90vh',
    transform: 'translateY(0)',
    borderRadius: `${radius.lg} ${radius.lg} 0 0`,
  } : {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth,
    maxHeight,
    borderRadius: radius.lg,
  };

  return createPortal(
    <div
      style={getModalOverlayStyle('rgba(0, 0, 0, 0.4)')}
      onClick={closeDisabled ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-label={ariaLabel}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalStyle,
          backgroundColor: colors.surface,
          boxShadow: shadows.cardElevated,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {(title || !closeDisabled) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.lg,
              borderBottom: title ? `1px solid ${colors.borderSecondary}30` : undefined,
            }}
          >
            {title && (
              <h2
                id="modal-title"
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.heading.join(', '),
                }}
              >
                {title}
              </h2>
            )}
            {!closeDisabled && (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => {
                  playPop();
                  onClose();
                }}
                aria-label="Close dialog"
                style={getModalCloseButtonStyle()}
              >
                ×
              </button>
            )}
          </div>
        )}
        
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: title ? undefined : spacing.lg,
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Confirm Dialog with unified modal
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false,
}) => {
  const { playClick } = useAudio();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      ariaLabel={`${title} confirmation dialog`}
      maxWidth={400}
    >
      <div style={{ padding: spacing.lg, paddingTop: 0 }}>
        <p
          style={{
            margin: 0,
            marginBottom: spacing.lg,
            color: colors.textSecondary,
            fontSize: typography.fontSize.base,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        
        <div
          style={{
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              playClick();
              onConfirm();
            }}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Bottom Sheet with unified modal
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="bottom-sheet"
    >
      {children}
    </Modal>
  );
};

// Minigame Modal with unified modal
interface MinigameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
  ariaLabel?: string;
  closeDisabled?: boolean;
  closeDisabledLabel?: string;
}

const MinigameModal: React.FC<MinigameModalProps> = ({
  isOpen,
  onClose,
  title,
  maxWidth = 520,
  maxHeight = 720,
  children,
  ariaLabel = 'Dialog',
  closeDisabled = false,
  closeDisabledLabel = 'Please wait for the current action to finish.',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      ariaLabel={ariaLabel}
      closeDisabled={closeDisabled}
      closeDisabledLabel={closeDisabledLabel}
    >
      {children}
    </Modal>
  );
};

export { Modal, ConfirmDialog, BottomSheet, MinigameModal, useModalBase };
