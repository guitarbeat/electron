import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Card from './Card';
import Button from './Button';
import { colors, spacing, typography, zIndex } from '../../design-system/tokens';

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
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('modal-open');
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
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
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Card variant="elevated" style={{ maxWidth: '400px', width: '100%', padding: spacing.xl }}>
          <h2
            id="confirm-dialog-title"
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
            id="confirm-dialog-message"
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
            <Button variant={variant} onClick={onConfirm} isLoading={isLoading} autoFocus>
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
