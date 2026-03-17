import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Card from './Card';
import Button from './Button';
import { colors, spacing, typography } from '@/design-system';
import {
  getModalCloseButtonStyle,
  getModalOverlayStyle,
  isFocusWithin,
  trapFocusOnTab,
} from './modalPrimitives';

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
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
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

    const initialFocusTimer = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusWithin(dialogRef.current)) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      trapFocusOnTab(event, dialogRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(initialFocusTimer);
      if (!hadModalOpenClassRef.current) {
        document.body.classList.remove('modal-open');
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div style={getModalOverlayStyle()} role="none presentation">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <Card
          variant="elevated"
          style={{ width: '100%', maxWidth: '420px', padding: spacing.xl, position: 'relative' }}
        >
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            style={{ ...getModalCloseButtonStyle(), width: '30px', height: '30px' }}
          >
            ✕
          </button>

          <h2
            id={titleId}
            style={{
              marginTop: 0,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            {title}
          </h2>
          <p
            id={messageId}
            style={{
              fontSize: typography.fontSize.base,
              color: colors.textSecondary,
              marginBottom: spacing.xl,
              lineHeight: typography.lineHeight.normal,
            }}
          >
            {message}
          </p>
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
              {cancelText}
            </Button>
            <Button
              ref={confirmButtonRef}
              variant={variant}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </Card>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
