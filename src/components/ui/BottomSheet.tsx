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
} from '@/design-system/tokens';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const previousFocusedElement = useRef<HTMLElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      previousFocusedElement.current?.focus?.();
      return undefined;
    }

    previousFocusedElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const initialFocusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && sheetRef.current) {
        const nodes = Array.from(
          sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
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
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTouchStart = (event: React.TouchEvent) => {
    startY.current = event.touches[0].clientY;
    currentY.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    const deltaY = event.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      currentY.current = deltaY;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentY.current > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    currentY.current = 0;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: zIndex.modal,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          animation: prefersReducedMotion ? undefined : 'fade-in 0.2s ease-out',
        }}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          backgroundColor: colors.surface3,
          borderRadius: `${radius.lg} ${radius.lg} 0 0`,
          padding: spacing.lg,
          paddingBottom: `calc(${spacing.lg} + env(safe-area-inset-bottom, 0px))`,
          boxShadow: shadows.cardElevated,
          animation: prefersReducedMotion
            ? undefined
            : 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: `transform ${motion.duration.fast} ${motion.easing.ease}`,
          maxHeight: '82vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: colors.textTertiary,
            borderRadius: radius.full,
            margin: '0 auto',
            marginBottom: spacing.md,
            opacity: 0.5,
          }}
          aria-hidden="true"
        />

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            width: '34px',
            height: '34px',
            borderRadius: radius.full,
            border: `1px solid ${colors.borderSubtle}`,
            background: colors.surface2,
            color: colors.textPrimary,
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {title && (
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.textPrimary,
              margin: 0,
              marginBottom: spacing.md,
              textAlign: 'center',
              fontFamily: typography.fontFamily.heading.join(', '),
            }}
          >
            {title}
          </h3>
        )}

        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;
