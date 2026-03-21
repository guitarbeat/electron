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
const LABEL_WIDTH = 132;
const LABEL_HEIGHT = 34;
const SIDE_GUTTER = 18;
const TOP_GUTTER = 18;
const BOTTOM_GUTTER = 24;
const MIN_RADIUS = 88;
const MAX_RADIUS = 220;
const RADIUS_STEP = 8;
const ANGLE_STEP = 8;
const MAX_ITEMS_PER_LANE = 4;
const DIRECTIONAL_PENALTY = 4;
const SPACING_PENALTY = 80;
const BOUNDARY_PENALTY = 18;
const ANGLE_PENALTY = 40;

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

const getLaneCounts = (count: number): number[] => {
  const lanes: number[] = [];
  let remaining = count;

  while (remaining > 0) {
    const lanesRemaining = Math.ceil(remaining / MAX_ITEMS_PER_LANE);
    const laneCount = Math.ceil(remaining / lanesRemaining);
    lanes.push(laneCount);
    remaining -= laneCount;
  }

  return lanes;
};

const getArcCandidates = (count: number, laneCount: number, viewportWidth: number): number[] => {
  const isMobile = viewportWidth <= MOBILE_BREAKPOINT;

  if (count <= 1) return [0];
  if (laneCount === 1) {
    if (count === 2) return isMobile ? [74, 86, 98] : [82, 94, 108];
    if (count === 3) return isMobile ? [86, 98, 112] : [94, 108, 122];
    return isMobile ? [94, 108, 120, 132] : [104, 118, 132, 146];
  }

  if (laneCount === 2) {
    return isMobile ? [84, 96, 108, 120] : [92, 104, 116, 128];
  }

  return isMobile ? [72, 84, 96, 108] : [80, 92, 104, 116];
};

const getAngleCandidates = (preferredAngle: number): number[] => {
  const candidates: number[] = [];

  for (let offset = 0; offset < 180; offset += ANGLE_STEP) {
    if (offset === 0) {
      candidates.push(normalizeAngle(preferredAngle));
      continue;
    }

    candidates.push(normalizeAngle(preferredAngle + offset));
    candidates.push(normalizeAngle(preferredAngle - offset));
  }

  return Array.from(new Set(candidates));
};

const getAllowedAngleRange = (
  horizontalPreference: number,
  verticalPreference: number,
): { min: number; max: number } => {
  if (horizontalPreference >= 0 && verticalPreference <= 0) {
    return { min: -92, max: 4 };
  }

  if (horizontalPreference >= 0 && verticalPreference > 0) {
    return { min: -4, max: 92 };
  }

  if (horizontalPreference < 0 && verticalPreference <= 0) {
    return { min: -184, max: -88 };
  }

  return { min: 88, max: 184 };
};

const buildArcPositions = (
  count: number,
  centerX: number,
  centerY: number,
  radius: number,
  baseAngle: number,
  totalArc: number,
  angleOffset = 0,
): ActionFanPosition[] => {
  if (count === 0) return [];

  const halfArc = totalArc / 2;
  const startAngle = baseAngle - halfArc + angleOffset;
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

const buildLanePositions = (
  laneCounts: readonly number[],
  centerX: number,
  centerY: number,
  baseRadius: number,
  rowGap: number,
  baseAngle: number,
  totalArc: number,
): ActionFanPosition[] => {
  const positions: ActionFanPosition[] = [];

  laneCounts.forEach((laneCount, laneIndex) => {
    const radius = baseRadius + laneIndex * rowGap;
    const laneArc = Math.max(60, totalArc - laneIndex * 14);
    const laneStep = laneCount > 1 ? laneArc / (laneCount - 1) : 0;
    const angleOffset = laneIndex % 2 === 1 ? laneStep / 2 : 0;

    positions.push(
      ...buildArcPositions(laneCount, centerX, centerY, radius, baseAngle, laneArc, angleOffset)
    );
  });

  return positions;
};

const measureLayoutPenalty = (
  positions: readonly ActionFanPosition[],
  safeLeft: number,
  safeRight: number,
  safeTop: number,
  safeBottom: number,
  minPairSpacing: number,
  centerX: number,
  centerY: number,
  horizontalPreference: number,
  verticalPreference: number,
  allowedAngleRange: { min: number; max: number },
): number => {
  let penalty = 0;
  const clampedPositions = positions.map((position) => ({
    x: clamp(position.x, safeLeft, safeRight),
    y: clamp(position.y, safeTop, safeBottom),
  }));

  positions.forEach((position, index) => {
    penalty += Math.max(safeLeft - position.x, 0) * BOUNDARY_PENALTY;
    penalty += Math.max(position.x - safeRight, 0) * BOUNDARY_PENALTY;
    penalty += Math.max(safeTop - position.y, 0) * BOUNDARY_PENALTY;
    penalty += Math.max(position.y - safeBottom, 0) * BOUNDARY_PENALTY;

    const clampedPosition = clampedPositions[index];
    const itemAngle =
      (Math.atan2(clampedPosition.y - centerY, clampedPosition.x - centerX) * 180) / Math.PI;
    const normalizedItemAngle = normalizeAngle(itemAngle);

    if (normalizedItemAngle < allowedAngleRange.min) {
      penalty += (allowedAngleRange.min - normalizedItemAngle) * ANGLE_PENALTY;
    }

    if (normalizedItemAngle > allowedAngleRange.max) {
      penalty += (normalizedItemAngle - allowedAngleRange.max) * ANGLE_PENALTY;
    }

    if (horizontalPreference > 8) {
      penalty += Math.max(centerX - clampedPosition.x, 0) * DIRECTIONAL_PENALTY;
    } else if (horizontalPreference < -8) {
      penalty += Math.max(clampedPosition.x - centerX, 0) * DIRECTIONAL_PENALTY;
    }

    if (verticalPreference > 8) {
      penalty += Math.max(centerY - clampedPosition.y, 0) * DIRECTIONAL_PENALTY;
    } else if (verticalPreference < -8) {
      penalty += Math.max(clampedPosition.y - centerY, 0) * DIRECTIONAL_PENALTY;
    }

    for (let comparisonIndex = 0; comparisonIndex < index; comparisonIndex += 1) {
      const spacing = distanceBetween(clampedPosition, clampedPositions[comparisonIndex]);
      penalty += Math.max(minPairSpacing - spacing, 0) * SPACING_PENALTY;
    }
  });

  return penalty;
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
  const laneCounts = getLaneCounts(count).reverse();
  const arcCandidates = getArcCandidates(count, laneCounts.length, viewportWidth);
  const angleCandidates = getAngleCandidates(preferredAngle);
  const allowedAngleRange = getAllowedAngleRange(horizontalPreference, verticalPreference);
  const rowGap = Math.round(itemSize * 0.92);
  const minPairSpacing = itemSize * 0.92;
  const maxBaseRadius = Math.max(MIN_RADIUS, MAX_RADIUS - rowGap * (laneCounts.length - 1));
  const initialBaseRadius = maxBaseRadius;

  let bestLayout:
    | {
        positions: ActionFanPosition[];
        penalty: number;
        baseRadius: number;
        baseAngle: number;
      }
    | null = null;

  for (let baseRadius = initialBaseRadius; baseRadius >= MIN_RADIUS; baseRadius -= RADIUS_STEP) {
    for (const totalArc of arcCandidates) {
      for (const baseAngle of angleCandidates) {
        const rawPositions = buildLanePositions(
          laneCounts,
          centerX,
          centerY,
          baseRadius,
          rowGap,
          baseAngle,
          totalArc
        );

        const penalty = measureLayoutPenalty(
          rawPositions,
          safeLeft,
          safeRight,
          safeTop,
          safeBottom,
          minPairSpacing,
          centerX,
          centerY,
          horizontalPreference,
          verticalPreference,
          allowedAngleRange
        );

        if (penalty === 0) {
          return rawPositions.map((position) => ({
            x: clamp(position.x, safeLeft, safeRight),
            y: clamp(position.y, safeTop, safeBottom),
          }));
        }

        if (
          !bestLayout ||
          penalty < bestLayout.penalty ||
          (penalty === bestLayout.penalty && baseRadius > bestLayout.baseRadius) ||
          (
            penalty === bestLayout.penalty &&
            baseRadius === bestLayout.baseRadius &&
            angularDistance(baseAngle, preferredAngle) < angularDistance(bestLayout.baseAngle, preferredAngle)
          )
        ) {
          bestLayout = {
            positions: rawPositions.map((position) => ({
              x: clamp(position.x, safeLeft, safeRight),
              y: clamp(position.y, safeTop, safeBottom),
            })),
            penalty,
            baseRadius,
            baseAngle,
          };
        }
      }
    }
  }

  if (bestLayout) {
    return bestLayout.positions;
  }

  return Array.from({ length: count }, (_, index) => ({
    x: clamp(centerX + index * 2, safeLeft, safeRight),
    y: clamp(centerY - MIN_RADIUS - index * 2, safeTop, safeBottom),
  }));
}
