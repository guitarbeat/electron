export interface FloatingViewport {
  width: number;
  height: number;
  offsetLeft?: number;
  offsetTop?: number;
  insetTop?: number;
  insetRight?: number;
  insetBottom?: number;
  insetLeft?: number;
}

export interface FloatingSize {
  width: number;
  height: number;
}

export interface FloatingPanelPosition {
  left: number;
  top: number;
  placement: "above" | "below";
}

export const FLOATING_CONTROL_SIZE = 52;
export const FLOATING_VIEWPORT_MARGIN = 12;
export const FLOATING_PANEL_GAP = 10;

const getBounds = (viewport: FloatingViewport, size: FloatingSize) => {
  const left =
    (viewport.offsetLeft ?? 0) +
    (viewport.insetLeft ?? 0) +
    FLOATING_VIEWPORT_MARGIN;
  const top =
    (viewport.offsetTop ?? 0) +
    (viewport.insetTop ?? 0) +
    FLOATING_VIEWPORT_MARGIN;

  return {
    left,
    top,
    right:
      (viewport.offsetLeft ?? 0) +
      viewport.width -
      (viewport.insetRight ?? 0) -
      FLOATING_VIEWPORT_MARGIN -
      size.width,
    bottom:
      (viewport.offsetTop ?? 0) +
      viewport.height -
      (viewport.insetBottom ?? 0) -
      FLOATING_VIEWPORT_MARGIN -
      size.height,
  };
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

export const clampFloatingControlPosition = (
  position: { x: number; y: number },
  viewport: FloatingViewport,
) => {
  const bounds = getBounds(viewport, {
    width: FLOATING_CONTROL_SIZE,
    height: FLOATING_CONTROL_SIZE,
  });

  return {
    x: clamp(position.x, bounds.left, bounds.right),
    y: clamp(position.y, bounds.top, bounds.bottom),
  };
};

export const getDockedFloatingControlPosition = (
  viewport: FloatingViewport,
) => {
  const bounds = getBounds(viewport, {
    width: FLOATING_CONTROL_SIZE,
    height: FLOATING_CONTROL_SIZE,
  });
  return { x: bounds.right, y: bounds.bottom };
};

export const getFloatingPanelPosition = (
  control: { x: number; y: number },
  panel: FloatingSize,
  viewport: FloatingViewport,
): FloatingPanelPosition => {
  const bounds = getBounds(viewport, panel);
  const spaceAbove = control.y - FLOATING_PANEL_GAP - bounds.top;
  const spaceBelow =
    bounds.bottom -
    (control.y + FLOATING_CONTROL_SIZE + FLOATING_PANEL_GAP);
  const placement =
    panel.height <= spaceAbove || spaceAbove >= spaceBelow ? "above" : "below";
  const preferredTop =
    placement === "above"
      ? control.y - FLOATING_PANEL_GAP - panel.height
      : control.y + FLOATING_CONTROL_SIZE + FLOATING_PANEL_GAP;

  return {
    left: clamp(
      control.x + FLOATING_CONTROL_SIZE - panel.width,
      bounds.left,
      bounds.right,
    ),
    top: clamp(preferredTop, bounds.top, bounds.bottom),
    placement,
  };
};
