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

const getCreativeLayoutCandidates = (count: number, viewportWidth: number): Array<{
  type: 'spiral' | 'flower' | 'wave' | 'cluster' | 'arc';
  radius: number;
  arc?: number;
  spiralTightness?: number;
  waveAmplitude?: number;
  clusterRows?: number;
  clusterCols?: number;
}> => {
  const candidates: Array<{
    type: 'spiral' | 'flower' | 'wave' | 'cluster' | 'arc';
    radius: number;
    arc?: number;
    spiralTightness?: number;
    waveAmplitude?: number;
    clusterRows?: number;
    clusterCols?: number;
  }> = [];
  const isMobile = viewportWidth <= MOBILE_BREAKPOINT;
  const baseRadius = isMobile ? 80 : 120;

  // Spiral layout - good for many items
  if (count >= 3) {
    candidates.push({
      type: 'spiral',
      radius: baseRadius,
      spiralTightness: 0.5
    });
  }

  // Flower/petal layout - good for 6-8 items
  if (count >= 5 && count <= 8) {
    candidates.push({
      type: 'flower',
      radius: baseRadius
    });
  }

  // Wave layout - good for medium counts
  if (count >= 4 && count <= 6) {
    candidates.push({
      type: 'wave',
      radius: baseRadius,
      waveAmplitude: 30
    });
  }

  // Cluster layout - good for many items in grid formation
  if (count >= 6) {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    candidates.push({
      type: 'cluster',
      radius: baseRadius,
      clusterRows: rows,
      clusterCols: cols
    });
  }

  // Traditional arc layouts with different radii
  if (count <= 3) {
    candidates.push({
      type: 'arc',
      radius: baseRadius - 20,
      arc: 90
    });
  }

  if (count <= 5) {
    candidates.push({
      type: 'arc',
      radius: baseRadius,
      arc: 120
    });
  }

  if (count <= 8) {
    candidates.push({
      type: 'arc',
      radius: baseRadius + 20,
      arc: 180
    });
  }

  return candidates;
};

const buildSpiralPositions = (
  count: number,
  centerX: number,
  centerY: number,
  baseRadius: number,
  tightness: number
): ActionFanPosition[] => {
  const positions: ActionFanPosition[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = i * 137.5; // Golden angle for optimal spiral
    const radius = baseRadius + (i * tightness * 8);
    const radians = (angle * Math.PI) / 180;
    
    positions.push({
      x: centerX + Math.cos(radians) * radius,
      y: centerY + Math.sin(radians) * radius,
    });
  }
  
  return positions;
};

const buildFlowerPositions = (
  count: number,
  centerX: number,
  centerY: number,
  baseRadius: number
): ActionFanPosition[] => {
  const positions: ActionFanPosition[] = [];
  const petals = count - 1; // One center, rest as petals
  
  // Center position
  positions.push({ x: centerX, y: centerY });
  
  // Petal positions
  for (let i = 0; i < petals; i++) {
    const angle = (i * 360) / petals;
    const radians = (angle * Math.PI) / 180;
    
    positions.push({
      x: centerX + Math.cos(radians) * baseRadius,
      y: centerY + Math.sin(radians) * baseRadius,
    });
  }
  
  return positions;
};

const buildWavePositions = (
  count: number,
  centerX: number,
  centerY: number,
  baseRadius: number,
  amplitude: number
): ActionFanPosition[] => {
  const positions: ActionFanPosition[] = [];
  
  for (let i = 0; i < count; i++) {
    const baseAngle = -90 + (i * (180 / (count - 1))); // Semi-circle
    const waveOffset = Math.sin((i / count) * Math.PI * 2) * amplitude;
    const radius = baseRadius + waveOffset;
    const radians = (baseAngle * Math.PI) / 180;
    
    positions.push({
      x: centerX + Math.cos(radians) * radius,
      y: centerY + Math.sin(radians) * radius,
    });
  }
  
  return positions;
};

const buildClusterPositions = (
  count: number,
  centerX: number,
  centerY: number,
  baseRadius: number,
  rows: number,
  cols: number
): ActionFanPosition[] => {
  const positions: ActionFanPosition[] = [];
  const itemSpacing = (baseRadius * 2) / Math.max(rows, cols);
  let placed = 0;
  
  for (let row = 0; row < rows && placed < count; row++) {
    for (let col = 0; col < cols && placed < count; col++) {
      const offsetX = (col - (cols - 1) / 2) * itemSpacing;
      const offsetY = (row - (rows - 1) / 2) * itemSpacing;
      
      positions.push({
        x: centerX + offsetX,
        y: centerY + offsetY,
      });
      placed++;
    }
  }
  
  return positions;
};

const buildCreativePositions = (
  layout: any,
  count: number,
  centerX: number,
  centerY: number
): ActionFanPosition[] => {
  switch (layout.type) {
    case 'spiral':
      return buildSpiralPositions(count, centerX, centerY, layout.radius, layout.spiralTightness);
    case 'flower':
      return buildFlowerPositions(count, centerX, centerY, layout.radius);
    case 'wave':
      return buildWavePositions(count, centerX, centerY, layout.radius, layout.waveAmplitude);
    case 'cluster':
      return buildClusterPositions(count, centerX, centerY, layout.radius, layout.clusterRows, layout.clusterCols);
    case 'arc':
    default:
      return buildPositions(count, centerX, centerY, layout.radius, 0, layout.arc || 180);
  }
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
  const minNeighborSpacing = itemSize * MIN_NEIGHBOR_SPACING_RATIO;

  // Try creative layouts first
  const creativeCandidates = getCreativeLayoutCandidates(count, viewportWidth);
  
  let bestLayout: {
    positions: ActionFanPosition[];
    overflow: number;
    layout: any;
  } | null = null;

  // Test creative layouts
  for (const layout of creativeCandidates) {
    const positions = buildCreativePositions(layout, count, centerX, centerY);
    const overflow = measureOverflow(
      positions,
      safeLeft,
      safeRight,
      safeTop,
      safeBottom,
      minNeighborSpacing
    );

    if (overflow === 0) {
      // Perfect fit found
      return positions.map((position) => ({
        x: clamp(position.x, safeLeft, safeRight),
        y: clamp(position.y, safeTop, safeBottom),
      }));
    }

    if (!bestLayout || overflow < bestLayout.overflow) {
      bestLayout = { positions, overflow, layout };
    }
  }

  // Fallback to original algorithm if creative layouts don't work
  const horizontalPreference = (safeRight - centerX) - (centerX - safeLeft);
  const verticalPreference = (safeBottom - centerY) - (centerY - safeTop);
  const preferredAngle = (Math.atan2(verticalPreference, horizontalPreference) * 180) / Math.PI;
  const angleCandidates = getAngleCandidates(preferredAngle);
  const arcCandidates = getArcCandidates(count, viewportWidth);
  const startingRadius = Math.min(
    MAX_RADIUS,
    Math.max(MIN_RADIUS, Math.round(Math.min(viewportWidth, viewportHeight) * 0.24 + (count * 8)))
  );

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
          return positions.map((position) => ({
            x: clamp(position.x, safeLeft, safeRight),
            y: clamp(position.y, safeTop, safeBottom),
          }));
        }

        const angleDistanceFromPreferred = angularDistance(baseAngle, preferredAngle);

        if (
          !bestLayout ||
          overflow < bestLayout.overflow ||
          (overflow === bestLayout.overflow && radius > bestLayout.layout.radius) ||
          (
            overflow === bestLayout.overflow &&
            radius === bestLayout.layout.radius &&
            angleDistanceFromPreferred < angularDistance(bestLayout.layout.baseAngle || 0, preferredAngle)
          )
        ) {
          bestLayout = {
            positions: positions.map((position) => ({
              x: clamp(position.x, safeLeft, safeRight),
              y: clamp(position.y, safeTop, safeBottom),
            })),
            overflow,
            layout: { type: 'arc', radius, baseAngle, totalArc }
          };
        }
      }
    }
  }

  if (bestLayout) {
    return bestLayout.positions;
  }

  // Ultimate fallback
  return Array.from({ length: count }, () => ({
    x: clamp(centerX, safeLeft, safeRight),
    y: clamp(centerY - MIN_RADIUS, safeTop, safeBottom),
  }));
}
