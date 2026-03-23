export interface ActionBubblePosition {
  x: number;
  y: number;
}

export interface ActionBubbleMenuPosition {
  left: string;
  top: string;
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
export const ACTION_BUBBLE_MENU_WIDTH = 260;
export const ACTION_BUBBLE_MENU_GUESS_HEIGHT = 262;
export const ACTION_BUBBLE_DOCK_GAP = 12;
export const ACTION_BUBBLE_TOGGLE_GAP = 6;
export const ACTION_BUBBLE_TOGGLE_WIDTH = 320;
export const ACTION_BUBBLE_TOGGLE_HEIGHT = 72;
export const ACTION_BUBBLE_TOGGLE_COMPACT_WIDTH = 240;
export const ACTION_BUBBLE_TOGGLE_COMPACT_HEIGHT = 52;

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

export const getActionBubbleMenuPosition = (
  bubblePosition: ActionBubblePosition,
  viewportWidth: number,
  viewportHeight: number,
  isMobile: boolean
): ActionBubbleMenuPosition => {
  const { bubbleSize, edgeMargin } = getActionBubbleLayout(isMobile);
  const margin = edgeMargin;
  const preferredX = bubblePosition.x;
  const menuMaxX = Math.max(margin, viewportWidth - ACTION_BUBBLE_MENU_WIDTH - margin);
  const x = Math.min(
    Math.max(preferredX - Math.floor((ACTION_BUBBLE_MENU_WIDTH - bubbleSize) / 2), margin),
    menuMaxX
  );

  const spaceBelow = viewportHeight - (bubblePosition.y + bubbleSize);
  const canFitBelow = spaceBelow - 10 >= ACTION_BUBBLE_MENU_GUESS_HEIGHT;
  const menuY = canFitBelow
    ? bubblePosition.y + bubbleSize + 10
    : bubblePosition.y - ACTION_BUBBLE_MENU_GUESS_HEIGHT - 10;
  const maxY = Math.max(margin, viewportHeight - ACTION_BUBBLE_MENU_GUESS_HEIGHT - margin);

  return {
    left: `${x}px`,
    top: `${Math.min(Math.max(menuY, margin), maxY)}px`,
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
  const toggleWidth = compact ? ACTION_BUBBLE_TOGGLE_COMPACT_WIDTH : ACTION_BUBBLE_TOGGLE_WIDTH;
  const toggleHeight = compact ? ACTION_BUBBLE_TOGGLE_COMPACT_HEIGHT : ACTION_BUBBLE_TOGGLE_HEIGHT;
  const preferredLeft = bubblePosition.x - toggleWidth - ACTION_BUBBLE_TOGGLE_GAP;
  const fallbackLeft = bubblePosition.x + bubbleSize + ACTION_BUBBLE_TOGGLE_GAP;
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
