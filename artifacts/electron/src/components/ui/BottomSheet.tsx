import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { colors, radius, spacing, typography, zIndex, shadows, motion } from '@/theme/tokens';
import { getModalCloseButtonStyle, getModalOverlayStyle } from './lib/modalPrimitives';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { CrossIcon } from '@/common/Icons';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeDisabled?: boolean;
  closeDisabledLabel?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeDisabled = false,
  closeDisabledLabel = 'This panel cannot be closed right now.',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { handleClose } = useModalBehavior({
    isOpen,
    onClose,
    closeDisabled,
    containerRef: sheetRef,
    initialFocusRef: closeButtonRef,
  });

  // Touch swipe-to-dismiss
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDraggingHandle = useRef(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleTouchStart = (event: React.TouchEvent) => {
    isDraggingHandle.current = true;
    startY.current = event.touches[0].clientY;
    currentY.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isDraggingHandle.current) return;
    const deltaY = event.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      currentY.current = deltaY;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingHandle.current) return;
    if (!closeDisabled && currentY.current > 100) {
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    currentY.current = 0;
    isDraggingHandle.current = false;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        ...getModalOverlayStyle('transparent', 'flex-end', 0),
        zIndex: zIndex.modal,
      }}
    >
      <button
        type="button"
        onClick={closeDisabled ? undefined : handleClose}
        aria-label={closeDisabled ? closeDisabledLabel : 'Close panel'}
        disabled={closeDisabled}
        tabIndex={-1}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          padding: 0,
          margin: 0,
          backgroundColor: 'rgba(11, 8, 16, 0.68)',
          backgroundImage:
            'radial-gradient(circle at top, rgba(255, 150, 197, 0.12), transparent 32%), radial-gradient(circle at bottom, rgba(149, 220, 255, 0.08), transparent 30%)',
          backdropFilter: 'blur(10px)',
          animation: prefersReducedMotion ? undefined : 'overlay-fade-in 0.2s ease-out',
          cursor: closeDisabled ? 'default' : 'pointer',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        tabIndex={closeDisabled ? -1 : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
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
          animation: prefersReducedMotion ? undefined : 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: `transform ${motion.duration.fast} ${motion.easing.ease}`,
          maxHeight: 'calc(100dvh - max(0.75rem, env(safe-area-inset-top, 0px)))',
          overflowY: 'auto',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: '60px',
            height: '6px',
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.18) 100%)',
            borderRadius: radius.full,
            margin: '0 auto',
            marginBottom: spacing.md,
            opacity: 0.85,
            boxShadow: shadows.glowStrong,
            cursor: 'grab',
            border: '10px solid transparent',
            backgroundClip: 'padding-box',
          }}
          aria-hidden="true"
        />

        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label={closeDisabled ? closeDisabledLabel : 'Close panel'}
          title={closeDisabled ? closeDisabledLabel : undefined}
          disabled={closeDisabled}
          style={{
            ...getModalCloseButtonStyle(),
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `all ${motion.duration.button} ${motion.easing.ease}`,
            opacity: closeDisabled ? 0.45 : 1,
            cursor: closeDisabled ? 'not-allowed' : 'pointer',
            padding: '12px',
          }}
          onMouseEnter={(e) => {
            if (!closeDisabled) e.currentTarget.style.backgroundColor = colors.surface3;
          }}
          onMouseLeave={(e) => {
            if (!closeDisabled) e.currentTarget.style.backgroundColor = colors.surface2;
          }}
        >
          <CrossIcon size={14} />
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
