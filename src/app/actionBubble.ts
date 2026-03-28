export interface ActionBubblePosition {
  x: number;
  y: number;
}

export interface ActionBubblePanelPosition {
  left: string;
  top: string;
  side: 'left' | 'right';
  transformOrigin: string;
}

export interface ActionBubbleTogglePosition {
  left: string;
  top: string;
}

export interface BubbleDockTarget {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Matches `.action-bubble` width/height in App.scss (default / desktop layout) */
export const ACTION_BUBBLE_SIZE = 78;
/** Matches `@media (max-width: 640px)` `.action-bubble` rules in App.scss */
export const ACTION_BUBBLE_SIZE_MOBILE = 64;

export const ACTION_BUBBLE_EDGE_MARGIN = 12;
/** Extra inset on phones so the bubble clears gesture areas and home indicator */
export const ACTION_BUBBLE_EDGE_MARGIN_MOBILE = 16;

export const ACTION_BUBBLE_DRAG_THRESHOLD = 5;
export const ACTION_BUBBLE_DOCK_GAP = 12;
export const ACTION_BUBBLE_PANEL_WIDTH = 336;
export const ACTION_BUBBLE_PANEL_GAP = 16;
export const ACTION_BUBBLE_PANEL_FALLBACK_HEIGHT = 312;
/**
 * Outer size of the floating tab button (`.action-bubble-toggle` padding + `.theme-toggle--icon-btn`).
 * Kept in sync with `App.scss` for the fused dock layout.
 */
export const ACTION_BUBBLE_TOGGLE_OUTER_WIDTH = 56;
export const ACTION_BUBBLE_TOGGLE_OUTER_HEIGHT = 56;
export const ACTION_BUBBLE_TOGGLE_OUTER_WIDTH_COMPACT = 52;
export const ACTION_BUBBLE_TOGGLE_OUTER_HEIGHT_COMPACT = 52;
/** Horizontal overlap between tab button shell and action bubble so they read as one control */
export const ACTION_BUBBLE_TOGGLE_OVERLAP = 10;

export const getActionBubbleLayout = (isMobile: boolean) => {
  const bubbleSize = isMobile ? ACTION_BUBBLE_SIZE_MOBILE : ACTION_BUBBLE_SIZE;
  const edgeMargin = isMobile ? ACTION_BUBBLE_EDGE_MARGIN_MOBILE : ACTION_BUBBLE_EDGE_MARGIN;
  return { bubbleSize, edgeMargin };
};

export const clampActionBubblePosition = (
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  isMobile: boolean
): ActionBubblePosition => {
  const { bubbleSize, edgeMargin } = getActionBubbleLayout(isMobile);
  const maxX = Math.max(edgeMargin, viewportWidth - bubbleSize - edgeMargin);
  const maxY = Math.max(edgeMargin, viewportHeight - bubbleSize - edgeMargin);

  return {
    x: Math.min(Math.max(x, edgeMargin), maxX),
    y: Math.min(Math.max(y, edgeMargin), maxY),
  };
};

export const getDefaultActionBubblePosition = (
  viewportWidth: number,
  viewportHeight: number,
  isMobile: boolean
): ActionBubblePosition => {
  const { bubbleSize, edgeMargin } = getActionBubbleLayout(isMobile);
  const defaultX = isMobile
    ? viewportWidth - bubbleSize - edgeMargin
    : ACTION_BUBBLE_EDGE_MARGIN + 6;
  const defaultY = viewportHeight - bubbleSize - edgeMargin - 6;

  return clampActionBubblePosition(defaultX, defaultY, viewportWidth, viewportHeight, isMobile);
};

export const getDockedActionBubblePosition = (
  target: BubbleDockTarget,
  viewportWidth: number,
  viewportHeight: number
): ActionBubblePosition => {
  const { bubbleSize, edgeMargin } = getActionBubbleLayout(false);
  const preferredX = target.left + target.width + ACTION_BUBBLE_DOCK_GAP;
  const fallbackX = target.left - bubbleSize - ACTION_BUBBLE_DOCK_GAP;
  const hasRoomOnRight = preferredX + bubbleSize + edgeMargin <= viewportWidth;
  const x = hasRoomOnRight ? preferredX : fallbackX;
  const y = target.top + (target.height - bubbleSize) / 2;

  return clampActionBubblePosition(x, y, viewportWidth, viewportHeight, false);
};

export const snapActionBubbleToEdge = (
  position: ActionBubblePosition,
  viewportWidth: number,
  viewportHeight: number,
  isMobile: boolean
): ActionBubblePosition => {
  const { bubbleSize, edgeMargin } = getActionBubbleLayout(isMobile);
  const midX = viewportWidth / 2;
  const snappedX =
    position.x + bubbleSize / 2 < midX ? edgeMargin : viewportWidth - bubbleSize - edgeMargin;

  return clampActionBubblePosition(snappedX, position.y, viewportWidth, viewportHeight, isMobile);
};

export const getActionBubblePanelPosition = (
  bubblePosition: ActionBubblePosition,
  viewportWidth: number,
  viewportHeight: number,
  panelHeight: number,
  isMobile: boolean
): ActionBubblePanelPosition => {
  const { bubbleSize, edgeMargin } = getActionBubbleLayout(isMobile);
  const margin = edgeMargin;
  const bubbleCenterX = bubblePosition.x + bubbleSize / 2;
  const preferredSide: 'left' | 'right' =
    bubbleCenterX < viewportWidth / 2 ? 'right' : 'left';

  const getLeftForSide = (side: 'left' | 'right') =>
    side === 'right'
      ? bubblePosition.x + bubbleSize + ACTION_BUBBLE_PANEL_GAP
      : bubblePosition.x - ACTION_BUBBLE_PANEL_WIDTH - ACTION_BUBBLE_PANEL_GAP;

  const fitsSide = (side: 'left' | 'right') => {
    const left = getLeftForSide(side);
    return left >= margin && left + ACTION_BUBBLE_PANEL_WIDTH <= viewportWidth - margin;
  };

  const side = fitsSide(preferredSide)
    ? preferredSide
    : preferredSide === 'right'
      ? fitsSide('left')
        ? 'left'
        : 'right'
      : fitsSide('right')
        ? 'right'
        : 'left';

  const unclampedLeft = getLeftForSide(side);
  const maxLeft = Math.max(margin, viewportWidth - ACTION_BUBBLE_PANEL_WIDTH - margin);
  const left = Math.min(Math.max(unclampedLeft, margin), maxLeft);

  const centeredTop = bubblePosition.y + bubbleSize / 2 - panelHeight / 2;
  const maxTop = Math.max(margin, viewportHeight - panelHeight - margin);
  const top = Math.min(Math.max(centeredTop, margin), maxTop);

  return {
    left: `${left}px`,
    top: `${top}px`,
    side,
    transformOrigin: side === 'right' ? 'left center' : 'right center',
  };
};

export const getActionBubbleTogglePosition = (
  bubblePosition: ActionBubblePosition,
  viewportWidth: number,
  viewportHeight: number,
  compact: boolean
): ActionBubbleTogglePosition => {
  const { bubbleSize, edgeMargin } = getActionBubbleLayout(compact);
  const margin = edgeMargin;
  const toggleWidth = compact ? ACTION_BUBBLE_TOGGLE_OUTER_WIDTH_COMPACT : ACTION_BUBBLE_TOGGLE_OUTER_WIDTH;
  const toggleHeight = compact ? ACTION_BUBBLE_TOGGLE_OUTER_HEIGHT_COMPACT : ACTION_BUBBLE_TOGGLE_OUTER_HEIGHT;
  const o = ACTION_BUBBLE_TOGGLE_OVERLAP;
  const preferredLeft = bubblePosition.x - toggleWidth + o;
  const fallbackLeft = bubblePosition.x + bubbleSize - o;
  const hasRoomOnLeft = preferredLeft >= margin;
  const clampedLeft = Math.min(
    Math.max(hasRoomOnLeft ? preferredLeft : fallbackLeft, margin),
    Math.max(margin, viewportWidth - toggleWidth - margin)
  );
  const centeredTop = bubblePosition.y + (bubbleSize - toggleHeight) / 2;
  const clampedTop = Math.min(
    Math.max(centeredTop, margin),
    Math.max(margin, viewportHeight - toggleHeight - margin)
  );

  return {
    left: `${clampedLeft}px`,
    top: `${clampedTop}px`,
  };
};
