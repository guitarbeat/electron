export interface ActionFanLayoutOptions {
  count: number;
  anchorX: number;
  anchorY: number;
  anchorSize: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface ActionFanPosition {
  x: number;
  y: number;
}

const MOBILE_BREAKPOINT = 600;
const DESKTOP_ITEM_SIZE = 72;
const MOBILE_ITEM_SIZE = 62;
const LABEL_WIDTH = 124;
const LABEL_HEIGHT = 26;
const SIDE_GUTTER = 16;
const TOP_GUTTER = 16;
const BOTTOM_GUTTER = 20;
const MAX_RADIUS = 160;
const MIN_RADIUS = 72;
const RADIUS_STEP = 6;
const ANGLE_STEP = 8;
const MIN_NEIGHBOR_SPACING_RATIO = 0.85;

const clamp = (value: number, min: number, max: number): number => {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
};

const normalizeAngle = (angle: number): number => {
  const normalized = ((angle + 180) % 360 + 360) % 360;
  return normalized - 180;
};

const angularDistance = (a: number, b: number): number => Math.abs(normalizeAngle(a - b));

const distanceBetween = (a: ActionFanPosition, b: ActionFanPosition): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

const getArcCandidates = (count: number, viewportWidth: number): number[] => {
  if (count <= 1) return [0];
  if (count === 2) return [80, 68];
  if (count <= 4) return [108, 96, 84];
  if (count <= 6) return [144, 128, 112, 98];
  if (count <= 8) return [176, 160, 144, 128, 112];

  const maxArc = viewportWidth <= MOBILE_BREAKPOINT ? 168 : 188;
  return [maxArc, maxArc - 20, maxArc - 40, 128, 108];
};

const getAngleCandidates = (preferredAngle: number): number[] => {
  const candidates: number[] = [];

  for (let offset = 0; offset < 360; offset += ANGLE_STEP) {
    if (offset === 0) {
      candidates.push(normalizeAngle(preferredAngle));
      continue;
    }

    candidates.push(normalizeAngle(preferredAngle + offset));
    candidates.push(normalizeAngle(preferredAngle - offset));
  }

  return Array.from(new Set(candidates));
};

const buildPositions = (
  count: number,
  centerX: number,
  centerY: number,
  radius: number,
  baseAngle: number,
  totalArc: number,
): ActionFanPosition[] => {
  if (count === 0) return [];

  const halfArc = totalArc / 2;
  const startAngle = baseAngle - halfArc;
  const step = count > 1 ? totalArc / (count - 1) : 0;

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + index * step;
    const radians = (angle * Math.PI) / 180;

    return {
      x: centerX + Math.cos(radians) * radius,
      y: centerY + Math.sin(radians) * radius,
    };
  });
};

const measureOverflow = (
  positions: readonly ActionFanPosition[],
  safeLeft: number,
  safeRight: number,
  safeTop: number,
  safeBottom: number,
  minNeighborSpacing: number,
): number => {
  let overflow = 0;

  positions.forEach((position, index) => {
    overflow += Math.max(safeLeft - position.x, 0);
    overflow += Math.max(position.x - safeRight, 0);
    overflow += Math.max(safeTop - position.y, 0);
    overflow += Math.max(position.y - safeBottom, 0);

    if (index === 0) {
      return;
    }

    const spacing = distanceBetween(position, positions[index - 1]);
    overflow += Math.max(minNeighborSpacing - spacing, 0) * 3;
  });

  return overflow;
};

export function computeActionFanPositions({
  count,
  anchorX,
  anchorY,
  anchorSize,
  viewportWidth,
  viewportHeight,
}: ActionFanLayoutOptions): ActionFanPosition[] {
  if (count <= 0) {
    return [];
  }

  const itemSize = viewportWidth <= MOBILE_BREAKPOINT ? MOBILE_ITEM_SIZE : DESKTOP_ITEM_SIZE;
  const halfItem = itemSize / 2;
  const safeLeft = Math.max(halfItem + SIDE_GUTTER, LABEL_WIDTH / 2 + SIDE_GUTTER);
  const safeRight = Math.max(safeLeft, viewportWidth - safeLeft);
  const safeTop = halfItem + TOP_GUTTER;
  const safeBottom = Math.max(safeTop, viewportHeight - (halfItem + LABEL_HEIGHT + BOTTOM_GUTTER));
  const centerX = anchorX + anchorSize / 2;
  const centerY = anchorY + anchorSize / 2;
  const horizontalPreference = (safeRight - centerX) - (centerX - safeLeft);
  const verticalPreference = (safeBottom - centerY) - (centerY - safeTop);
  const preferredAngle = (Math.atan2(verticalPreference, horizontalPreference) * 180) / Math.PI;
  const angleCandidates = getAngleCandidates(preferredAngle);
  const arcCandidates = getArcCandidates(count, viewportWidth);
  const minNeighborSpacing = itemSize * MIN_NEIGHBOR_SPACING_RATIO;
  const startingRadius = Math.min(
    MAX_RADIUS,
    Math.max(MIN_RADIUS, Math.round(Math.min(viewportWidth, viewportHeight) * 0.24 + (count * 8)))
  );

  let bestFallback: {
    positions: ActionFanPosition[];
    overflow: number;
    angleDistance: number;
    radius: number;
  } | null = null;

  for (let radius = startingRadius; radius >= MIN_RADIUS; radius -= RADIUS_STEP) {
    for (const totalArc of arcCandidates) {
      for (const baseAngle of angleCandidates) {
        const positions = buildPositions(count, centerX, centerY, radius, baseAngle, totalArc);
        const overflow = measureOverflow(
          positions,
          safeLeft,
          safeRight,
          safeTop,
          safeBottom,
          minNeighborSpacing
        );

        if (overflow === 0) {
          return positions;
        }

        const angleDistanceFromPreferred = angularDistance(baseAngle, preferredAngle);

        if (
          !bestFallback ||
          overflow < bestFallback.overflow ||
          (overflow === bestFallback.overflow && radius > bestFallback.radius) ||
          (
            overflow === bestFallback.overflow &&
            radius === bestFallback.radius &&
            angleDistanceFromPreferred < bestFallback.angleDistance
          )
        ) {
          bestFallback = {
            positions,
            overflow,
            angleDistance: angleDistanceFromPreferred,
            radius,
          };
        }
      }
    }
  }

  if (bestFallback) {
    return bestFallback.positions.map((position) => ({
      x: clamp(position.x, safeLeft, safeRight),
      y: clamp(position.y, safeTop, safeBottom),
    }));
  }

  return Array.from({ length: count }, () => ({
    x: clamp(centerX, safeLeft, safeRight),
    y: clamp(centerY - MIN_RADIUS, safeTop, safeBottom),
  }));
}
