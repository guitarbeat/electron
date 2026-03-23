export interface ActionBubblePosition {
  x: number;
  y: number;
}

export interface ActionBubbleMenuPosition {
  left: string;
  top: string;
}

/** Matches `.action-bubble` width/height in App.scss (default layout) */
export const ACTION_BUBBLE_SIZE = 78;
export const ACTION_BUBBLE_EDGE_MARGIN = 12;
export const ACTION_BUBBLE_DRAG_THRESHOLD = 5;
export const ACTION_BUBBLE_MENU_WIDTH = 260;
export const ACTION_BUBBLE_MENU_GUESS_HEIGHT = 262;

export const clampActionBubblePosition = (
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number
): ActionBubblePosition => {
  const maxX = Math.max(
    ACTION_BUBBLE_EDGE_MARGIN,
    viewportWidth - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
  );
  const maxY = Math.max(
    ACTION_BUBBLE_EDGE_MARGIN,
    viewportHeight - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
  );

  return {
    x: Math.min(Math.max(x, ACTION_BUBBLE_EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, ACTION_BUBBLE_EDGE_MARGIN), maxY),
  };
};

export const getDefaultActionBubblePosition = (
  viewportWidth: number,
  viewportHeight: number,
  isMobile: boolean
): ActionBubblePosition => {
  const defaultX = isMobile
    ? viewportWidth - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN
    : ACTION_BUBBLE_EDGE_MARGIN + 6;
  const defaultY = viewportHeight - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN - 6;

  return clampActionBubblePosition(defaultX, defaultY, viewportWidth, viewportHeight);
};

export const snapActionBubbleToEdge = (
  position: ActionBubblePosition,
  viewportWidth: number,
  viewportHeight: number
): ActionBubblePosition => {
  const midX = viewportWidth / 2;
  const snappedX =
    position.x + ACTION_BUBBLE_SIZE / 2 < midX
      ? ACTION_BUBBLE_EDGE_MARGIN
      : viewportWidth - ACTION_BUBBLE_SIZE - ACTION_BUBBLE_EDGE_MARGIN;

  return clampActionBubblePosition(snappedX, position.y, viewportWidth, viewportHeight);
};

export const getActionBubbleMenuPosition = (
  bubblePosition: ActionBubblePosition,
  viewportWidth: number,
  viewportHeight: number
): ActionBubbleMenuPosition => {
  const margin = ACTION_BUBBLE_EDGE_MARGIN;
  const preferredX = bubblePosition.x;
  const menuMaxX = Math.max(margin, viewportWidth - ACTION_BUBBLE_MENU_WIDTH - margin);
  const x = Math.min(
    Math.max(preferredX - Math.floor((ACTION_BUBBLE_MENU_WIDTH - ACTION_BUBBLE_SIZE) / 2), margin),
    menuMaxX
  );

  const spaceBelow = viewportHeight - (bubblePosition.y + ACTION_BUBBLE_SIZE);
  const canFitBelow = spaceBelow - 10 >= ACTION_BUBBLE_MENU_GUESS_HEIGHT;
  const menuY = canFitBelow
    ? bubblePosition.y + ACTION_BUBBLE_SIZE + 10
    : bubblePosition.y - ACTION_BUBBLE_MENU_GUESS_HEIGHT - 10;
  const maxY = Math.max(margin, viewportHeight - ACTION_BUBBLE_MENU_GUESS_HEIGHT - margin);

  return {
    left: `${x}px`,
    top: `${Math.min(Math.max(menuY, margin), maxY)}px`,
  };
};
