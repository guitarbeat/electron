import React from 'react';
import { colors, radius, shadows, spacing } from '../../design-system/tokens';

export const FLOATING_BUBBLE_SIZE = 60;
export const FLOATING_BUBBLE_EDGE_MARGIN = 16;
export const FLOATING_DRAG_THRESHOLD = 4;
export const FLOATING_PANEL_Z_INDEX = 1000;
export const FLOATING_FULLSCREEN_Z_INDEX = 2000;

export interface BubblePosition {
  x: number;
  y: number;
}

export const clampFloatingBubblePosition = (
  x: number,
  y: number,
  bubbleSize: number = FLOATING_BUBBLE_SIZE
): BubblePosition => {
  if (typeof window === 'undefined') {
    return { x, y };
  }

  const maxX = Math.max(
    FLOATING_BUBBLE_EDGE_MARGIN,
    window.innerWidth - bubbleSize - FLOATING_BUBBLE_EDGE_MARGIN
  );
  const maxY = Math.max(
    FLOATING_BUBBLE_EDGE_MARGIN,
    window.innerHeight - bubbleSize - FLOATING_BUBBLE_EDGE_MARGIN
  );

  return {
    x: Math.min(Math.max(x, FLOATING_BUBBLE_EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, FLOATING_BUBBLE_EDGE_MARGIN), maxY),
  };
};

interface BubbleButtonStyleOptions {
  position: BubblePosition;
  isDragging: boolean;
  background: string;
  color: string;
  fontSize: string;
  zIndex?: number;
  boxShadow?: string;
}

export const getFloatingBubbleButtonStyle = ({
  position,
  isDragging,
  background,
  color,
  fontSize,
  zIndex = FLOATING_PANEL_Z_INDEX,
  boxShadow = shadows.glow,
}: BubbleButtonStyleOptions): React.CSSProperties => ({
  position: 'fixed',
  left: position.x,
  top: position.y,
  width: `${FLOATING_BUBBLE_SIZE}px`,
  height: `${FLOATING_BUBBLE_SIZE}px`,
  borderRadius: radius.full,
  border: `3px solid ${colors.surfaceElevated}`,
  background,
  color,
  fontSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: isDragging ? 'grabbing' : 'grab',
  boxShadow,
  padding: 0,
  zIndex,
  touchAction: 'none',
  userSelect: 'none',
});

export const getFloatingBubbleBadgeStyle = (): React.CSSProperties => ({
  position: 'absolute',
  top: '-6px',
  right: '-6px',
  minWidth: '24px',
  height: '24px',
  borderRadius: radius.full,
  backgroundColor: colors.surfaceElevated,
  color: colors.textPrimary,
  fontSize: '11px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${colors.accent}`,
  boxShadow: shadows.card,
  padding: '0 4px',
});

interface FloatingContainerStyleOptions {
  isEmbedded: boolean;
  isViewportExpanded: boolean;
  isMobile: boolean;
  desktopWidth: string;
  zIndex?: number;
}

export const getFloatingContainerStyle = ({
  isEmbedded,
  isViewportExpanded,
  isMobile,
  desktopWidth,
  zIndex = FLOATING_PANEL_Z_INDEX,
}: FloatingContainerStyleOptions): React.CSSProperties => {
  if (isViewportExpanded) {
    return {
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      zIndex: FLOATING_FULLSCREEN_Z_INDEX,
      backgroundColor: colors.surface,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
    };
  }

  if (isEmbedded) {
    return {
      position: 'relative',
      width: '100%',
    };
  }

  return {
    position: 'fixed',
    bottom: `max(${spacing.lg}, env(safe-area-inset-bottom))`,
    right: spacing.lg,
    width: isMobile ? 'calc(100vw - 32px)' : desktopWidth,
    maxWidth: '100%',
    zIndex,
  };
};

