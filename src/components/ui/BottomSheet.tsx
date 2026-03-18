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
} from './modalPrimitives';
import { useAudio } from '@/hooks/useAudio';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const { playPop } = useAudio();
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const initialFocusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusWithin(sheetRef.current)) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      trapFocusOnTab(event, sheetRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(initialFocusTimer);
      document.body.style.overflow = previousOverflow;
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
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    currentY.current = 0;
  };

  const handleClose = () => {
    playPop();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        ...getModalOverlayStyle('transparent', 'flex-end', 0),
        zIndex: zIndex.modal,
      }}
    >
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(11, 8, 16, 0.68)',
          backgroundImage:
            'radial-gradient(circle at top, rgba(255, 150, 197, 0.12), transparent 32%), radial-gradient(circle at bottom, rgba(149, 220, 255, 0.08), transparent 30%)',
          backdropFilter: 'blur(10px)',
          animation: prefersReducedMotion ? undefined : 'fade-in 0.2s ease-out',
        }}
        aria-hidden="true"
      />

      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}
      </style>

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
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 18%), linear-gradient(180deg, rgba(61, 37, 52, 0.98) 0%, rgba(27, 16, 25, 0.96) 100%)',
          borderRadius: `${radius.xl} ${radius.xl} 0 0`,
          border: `1px solid ${colors.borderSecondary}50`,
          borderBottom: 'none',
          padding: spacing.lg,
          paddingBottom: `calc(${spacing.lg} + env(safe-area-inset-bottom, 0px))`,
          boxShadow: `${shadows.floating}, 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 32px rgba(255,127,198,0.14)`,
          animation: prefersReducedMotion
            ? undefined
            : 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: `transform ${motion.duration.fast} ${motion.easing.ease}`,
          maxHeight: '82vh',
          overflowY: 'auto',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.18) 100%)',
            borderRadius: radius.full,
            margin: '0 auto',
            marginBottom: spacing.md,
            opacity: 0.85,
            boxShadow: shadows.glowStrong,
          }}
          aria-hidden="true"
        />

        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label="Close panel"
          style={{
            ...getModalCloseButtonStyle(),
            fontSize: '1rem',
            width: '32px',
            height: '32px',
            transition: `all ${motion.duration.button} ${motion.easing.ease}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.surface3)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.surface2)}
        >
          ✕
        </button>

        {title && (
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: '#fff3f7',
              margin: 0,
              marginBottom: spacing.md,
              textAlign: 'center',
              fontFamily: typography.fontFamilyValue.heading,
              letterSpacing: typography.letterSpacing.eyebrow,
              textShadow: shadows.textGlow,
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

