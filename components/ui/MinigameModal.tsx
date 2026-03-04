import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { colors, spacing, shadows, typography } from '../../design-system/tokens';

export interface MinigameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Max width of the content box (default 520) */
  maxWidth?: number;
  /** Max height of the content box (default 720) */
  maxHeight?: number;
  children: React.ReactNode;
  /** Accessible label for the dialog */
  ariaLabel?: string;
}

/**
 * Shared modal for extras (spin wheel, etc.): backdrop, centered box, optional title, close button.
 * Locks body scroll when open. Use for a consistent minigame/popover UX.
 */
const MinigameModal: React.FC<MinigameModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  ariaLabel = 'Dialog',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        padding: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: colors.surface,
          borderRadius: 0,
          border: 'none',
          boxShadow: shadows.cardElevated,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: optional title + close */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: title ? 'space-between' : 'flex-end',
            padding: `${spacing.sm} ${spacing.md}`,
            borderBottom: title ? `1px solid ${colors.borderSecondary}25` : 'none',
            minHeight: 48,
          }}
        >
          {title && (
            <h2
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.lg,
                color: colors.textPrimary,
                letterSpacing: '0.03em',
              }}
            >
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: title ? 'relative' : 'absolute',
              top: title ? undefined : spacing.sm,
              right: title ? undefined : spacing.sm,
              width: 40,
              height: 40,
              padding: 0,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              color: colors.textSecondary,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MinigameModal;
