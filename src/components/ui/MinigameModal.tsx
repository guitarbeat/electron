import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { colors, spacing, shadows, typography, radius, zIndex, motion } from '@/theme/tokens';
import { getModalOverlayStyle, isFocusWithin, trapFocusOnTab } from './modalPrimitives';
import { useAudio } from '@/hooks/useAudio';

interface MinigameModalProps {
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
  /** Prevent dismissal while a critical action is active */
  closeDisabled?: boolean;
  /** Explain why dismissal is temporarily disabled */
  closeDisabledLabel?: string;
}

/**
 * Shared modal for extras (spin wheel, etc.): backdrop, centered box, optional title, close button.
 * Locks body scroll when open. Use for a consistent minigame/popover UX.
 */
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
  const { playPop } = useAudio();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      previousFocusedElement.current?.focus?.();
      return undefined;
    }

    previousFocusedElement.current = document.activeElement as HTMLElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const initialFocusTimer = window.setTimeout(() => {
      if (closeDisabled) {
        dialogRef.current?.focus();
        return;
      }

      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(initialFocusTimer);
      document.body.style.overflow = prev;
    };
  }, [closeDisabled, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusWithin(dialogRef.current)) {
        return;
      }

      if (event.key === 'Escape' && !closeDisabled) {
        event.preventDefault();
        onClose();
        return;
      }

      trapFocusOnTab(event, dialogRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDisabled, isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (closeDisabled) return;
    playPop();
    onClose();
  };

  return createPortal(
    <div
      style={{
        ...getModalOverlayStyle('rgba(10, 6, 14, 0.64)', 'center', 0),
        zIndex: zIndex.modal + 100, // Higher than other modals
        width: '100vw',
        height: '100vh',
        backgroundImage:
          'radial-gradient(circle at top, rgba(255, 150, 197, 0.14), transparent 30%), radial-gradient(circle at bottom, rgba(149, 220, 255, 0.1), transparent 28%)',
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="minigame-modal-surface"
        style={{
          position: 'relative',
          width: 'min(100vw, 100%)',
          height: 'min(100vh, 100%)',
          maxWidth: `min(${maxWidth}px, 100vw)`,
          maxHeight: `min(${maxHeight}px, 100vh)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 20%), linear-gradient(180deg, rgba(60, 34, 49, 0.96) 0%, rgba(28, 16, 24, 0.96) 100%)',
          borderRadius: radius.xl,
          border: `1px solid ${colors.borderSecondary}55`,
          boxShadow: `${shadows.floating}, 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 36px rgba(255,127,198,0.16)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          animation: `minigame-modal-pop ${motion.duration.normal} ${motion.easing.spring} both`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>
          {`
            @keyframes minigame-modal-pop {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}
        </style>

        {/* Header: optional title + close */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: title ? 'space-between' : 'flex-end',
            padding: `${spacing.md} ${spacing.lg}`,
            borderBottom: title ? `1px solid ${colors.borderSecondary}30` : 'none',
            minHeight: 48,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          {title && (
            <h2
              style={{
                margin: 0,
                fontFamily: typography.fontFamilyValue.heading,
                fontSize: typography.fontSize.lg,
                color: 'rgba(255, 245, 249, 0.95)',
                letterSpacing: typography.letterSpacing.eyebrow,
                textShadow: shadows.textGlow,
              }}
            >
              {title}
            </h2>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label={closeDisabled ? closeDisabledLabel : 'Close'}
            title={closeDisabled ? closeDisabledLabel : 'Close'}
            disabled={closeDisabled}
            style={{
              position: title ? 'relative' : 'absolute',
              top: title ? undefined : spacing.sm,
              right: title ? undefined : spacing.sm,
              width: 40,
              height: 40,
              padding: 0,
              borderRadius: radius.full,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 100%), rgba(41, 26, 37, 0.74)',
              color: '#fff3f7',
              border: `1px solid ${colors.borderSecondary}45`,
              cursor: closeDisabled ? 'not-allowed' : 'pointer',
              opacity: closeDisabled ? 0.45 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: shadows.button,
              transition: `all ${motion.duration.button} ${motion.easing.ease}`,
            }}
            onMouseEnter={(e) => {
              if (!closeDisabled) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = colors.accent;
              }
            }}
            onMouseLeave={(e) => {
              if (!closeDisabled) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = `${colors.borderSecondary}45`;
              }
            }}
            onMouseDown={(e) => {
              if (!closeDisabled) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              if (!closeDisabled) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
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

