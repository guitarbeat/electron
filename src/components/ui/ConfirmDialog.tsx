import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Card from './Card';
import Button from './Button';
import { colors, spacing, typography, zIndex, radius } from '../../design-system/tokens';

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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

  useEffect(() => {
    if (!isOpen) {
      previousFocusedElement.current?.focus?.();
      return undefined;
    }

    previousFocusedElement.current = document.activeElement as HTMLElement;
    document.body.classList.add('modal-open');

    const initialFocusTimer = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const nodes = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((node) => !node.hasAttribute('disabled'));

        if (!nodes.length) {
          event.preventDefault();
          return;
        }

        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(initialFocusTimer);
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.overlay,
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: zIndex.modal,
        padding: spacing.md,
      }}
      role="none presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <Card
          variant="elevated"
          style={{ width: '100%', padding: spacing.xl, position: 'relative' }}
        >
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              width: '30px',
              height: '30px',
              borderRadius: radius.full,
              border: `1px solid ${colors.borderSubtle}`,
              background: colors.surface2,
              color: colors.textPrimary,
              cursor: 'pointer',
              lineHeight: 1,
            }}
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
