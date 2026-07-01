/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { colors, radius, spacing, typography, shadows } from "@/theme/tokens";
import {
  getModalCloseButtonStyle,
  getModalOverlayStyle,
  isFocusWithin,
  trapFocusOnTab,
} from './lib/modalPrimitives';
import { useAudio } from '@/hooks/useAudio';
import Button from './LegacyButton';
import SharedBottomSheet from './BottomSheet';
import SharedMinigameModal from './MinigameModal';

// Base modal hook for shared functionality
const useModalBase = (
  isOpen: boolean,
  onClose?: () => void,
  closeDisabled?: boolean,
) => {
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
    hadModalOpenClassRef.current =
      document.body.classList.contains("modal-open");
    document.body.classList.add("modal-open");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFocusWithin(dialogRef.current)) {
        if (closeDisabled) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        onClose?.();
      }
      if (event.key === "Tab" && dialogRef.current) {
        trapFocusOnTab(event, dialogRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (!hadModalOpenClassRef.current) {
        document.body.classList.remove("modal-open");
      }
    };
  }, [closeDisabled, isOpen, onClose]);

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
  variant?: "centered" | "bottom-sheet";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  ariaLabel = "Dialog",
  maxWidth = 520,
  maxHeight = 720,
  closeDisabled = false,
  closeDisabledLabel,
  variant = "centered",
}) => {
  const { dialogRef, closeButtonRef, playPop } = useModalBase(
    isOpen,
    onClose,
    closeDisabled,
  );
  const titleId = useId();

  if (!isOpen) return null;

  const isBottomSheet = variant === "bottom-sheet";

  const modalStyle = isBottomSheet
    ? {
        position: "fixed" as const,
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: "100%",
        maxHeight: "min(90dvh, 90vh)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transform: "translateY(0)",
        borderRadius: `${radius.lg} ${radius.lg} 0 0`,
      }
    : {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth,
        maxHeight,
        borderRadius: radius.lg,
      };

  return createPortal(
    <div
      style={{
        ...getModalOverlayStyle("rgba(0, 0, 0, 0.4)"),
        minHeight: "100dvh",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={closeDisabled ? undefined : onClose}
        aria-label={
          closeDisabled
            ? (closeDisabledLabel ?? "Dialog cannot be closed")
            : "Close dialog"
        }
        disabled={closeDisabled}
        tabIndex={-1}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          padding: 0,
          margin: 0,
          background: "transparent",
          cursor: closeDisabled ? "default" : "pointer",
        }}
      />
      <div
        ref={dialogRef}
        style={{
          ...modalStyle,
          zIndex: 1,
          backgroundColor: colors.surface,
          boxShadow: shadows.cardElevated,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {(title || !closeDisabled) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: spacing.lg,
              borderBottom: title
                ? `1px solid ${colors.borderSecondary}30`
                : undefined,
            }}
          >
            {title && (
              <h2
                id={titleId}
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.heading.join(", "),
                }}
              >
                {title}
              </h2>
            )}
            {!closeDisabled ? (
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
            ) : (
              <button
                ref={closeButtonRef}
                type="button"
                disabled
                aria-label={closeDisabledLabel ?? "Dialog cannot be closed"}
                title={closeDisabledLabel}
                style={{
                  ...getModalCloseButtonStyle(),
                  opacity: 0.45,
                  cursor: "not-allowed",
                }}
              >
                ×
              </button>
            )}
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: title ? undefined : spacing.lg,
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
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
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
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
            display: "flex",
            gap: spacing.md,
            justifyContent: "flex-end",
          }}
        >
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
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

/** Canonical bottom sheet — see `../BottomSheet.tsx`; re-exported for one import surface. */
const BottomSheet = SharedBottomSheet;

const MinigameModal = SharedMinigameModal;

export { Modal, ConfirmDialog, BottomSheet, MinigameModal, useModalBase };
