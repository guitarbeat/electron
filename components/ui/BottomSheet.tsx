import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  colors,
  radius,
  spacing,
  typography,
  zIndex,
  shadows,
  motion,
} from '../../design-system/tokens';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Mobile-friendly bottom sheet component with slide-up animation and backdrop.
 */
const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - startY.current;
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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'fade-in 0.2s ease-out',
        }}
        aria-hidden="true"
      />

      {/* Sheet */}
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
          maxWidth: '500px',
          backgroundColor: colors.surfaceElevated,
          borderRadius: `${radius.lg} ${radius.lg} 0 0`,
          padding: spacing.lg,
          paddingBottom: `calc(${spacing.lg} + env(safe-area-inset-bottom, 0px))`,
          boxShadow: shadows.cardElevated,
          animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: `transform ${motion.duration.fast} ${motion.easing.ease}`,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
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

        {children}
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;
