export type BubbleViewportBucket = 'mobile' | 'desktop';
export type BubbleToolId = 'messages' | 'spin' | 'snake' | 'quiz' | 'matchmaker' | 'foodDrop';

export interface BubbleSlot {
  edge: 'left' | 'right';
  index: number;
}

export interface BubbleSlotPosition {
  slot: BubbleSlot;
  x: number;
  y: number;
}

export const BUBBLE_SIZE = 60;
export const BUBBLE_EDGE_MARGIN = 16;
export const BUBBLE_SLOT_GAP = 12;
export const BUBBLE_DOCK_EDGE: BubbleSlot['edge'] = 'right';

const TOP_OFFSET = 110;
const BOTTOM_OFFSET = 96;

export const getViewportBucket = (width: number): BubbleViewportBucket =>
  width <= 640 ? 'mobile' : 'desktop';

export const getDockSlots = (width: number, height: number, bucket: BubbleViewportBucket): BubbleSlotPosition[] => {
  const maxByHeight = Math.max(
    1,
    Math.floor((height - TOP_OFFSET - BOTTOM_OFFSET - BUBBLE_SIZE) / (BUBBLE_SIZE + BUBBLE_SLOT_GAP)) +
      1
  );
  const perEdge = Math.max(1, Math.min(maxByHeight, bucket === 'mobile' ? 4 : 8));

  const slots: BubbleSlotPosition[] = [];
  for (let index = 0; index < perEdge; index += 1) {
    const y = TOP_OFFSET + index * (BUBBLE_SIZE + BUBBLE_SLOT_GAP);
    slots.push({
      slot: { edge: BUBBLE_DOCK_EDGE, index },
      x: width - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN,
      y,
    });
  }

  return slots;
};

export const toSlotKey = (slot: BubbleSlot): string => `${slot.edge}:${slot.index}`;

export const parseSlotKey = (key: string): BubbleSlot | null => {
  const [edge, rawIndex] = key.split(':');
  if ((edge !== 'left' && edge !== 'right') || !rawIndex) {
    return null;
  }
  const index = Number(rawIndex);
  if (!Number.isFinite(index) || index < 0) {
    return null;
  }
  return { edge, index };
};

export const getNearestSlot = (x: number, y: number, slots: BubbleSlotPosition[]): BubbleSlotPosition | null => {
  if (!slots.length) return null;
  let nearest = slots[0];
  let nearestDist = Number.POSITIVE_INFINITY;
  slots.forEach((candidate) => {
    const dx = x - candidate.x;
    const dy = y - candidate.y;
    const dist = dx * dx + dy * dy;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = candidate;
    }
  });
  return nearest;
};

export const clampToViewport = (x: number, y: number, width: number, height: number) => {
  const maxX = Math.max(BUBBLE_EDGE_MARGIN, width - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN);
  const maxY = Math.max(BUBBLE_EDGE_MARGIN, height - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN);
  return {
    x: Math.min(Math.max(x, BUBBLE_EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, BUBBLE_EDGE_MARGIN), maxY),
  };
};

export const getAdjacentSlot = (
  current: BubbleSlot,
  direction: 'left' | 'right' | 'up' | 'down',
  maxIndex: number
): BubbleSlot => {
  if (direction === 'left') {
    return { edge: BUBBLE_DOCK_EDGE, index: current.index };
  }
  if (direction === 'right') {
    return { edge: BUBBLE_DOCK_EDGE, index: current.index };
  }
  if (direction === 'up') {
    return { edge: current.edge, index: Math.max(0, current.index - 1) };
  }
  return { edge: current.edge, index: Math.min(maxIndex, current.index + 1) };
};
