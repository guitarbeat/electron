import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BubbleId, useBubbleDismiss } from '../../context/BubbleDismissContext';
import {
  BUBBLE_DOCK_EDGE,
  BubbleSlot,
  BubbleToolId,
  BubbleViewportBucket,
  clampToViewport,
  getAdjacentSlot,
  getDockSlots,
  getNearestSlot,
  getViewportBucket,
  parseSlotKey,
  toSlotKey,
} from './bubbleLayout';

const STORAGE_KEY = 'bubbleDocking:v1';
const LONG_PRESS_MS = 180;
const MOVE_THRESHOLD = 5;

type SlotPersistence = Record<BubbleViewportBucket, Partial<Record<BubbleToolId, string>>>;

interface UseBubbleDockingProps {
  bubbleIds: BubbleToolId[];
  onActivate: (id: BubbleToolId) => void;
}

interface PointerState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  dragging: boolean;
  timer: number | null;
}

const loadPersisted = (): SlotPersistence => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mobile: {}, desktop: {} };
    const parsed = JSON.parse(raw) as SlotPersistence;
    return {
      mobile: parsed.mobile || {},
      desktop: parsed.desktop || {},
    };
  } catch {
    return { mobile: {}, desktop: {} };
  }
};

const savePersisted = (value: SlotPersistence) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const useBubbleDocking = ({ bubbleIds, onActivate }: UseBubbleDockingProps) => {
  const { hiddenBubbles, setDragging, checkDismissZoneHit, dismiss } = useBubbleDismiss();
  const [bucket, setBucket] = useState<BubbleViewportBucket>(() =>
    typeof window === 'undefined' ? 'desktop' : getViewportBucket(window.innerWidth)
  );
  const [persisted, setPersisted] = useState<SlotPersistence>(() => loadPersisted());
  const [livePositions, setLivePositions] = useState<Partial<Record<BubbleToolId, { x: number; y: number }>>>({});
  const [movingBubbleId, setMovingBubbleId] = useState<BubbleToolId | null>(null);
  const [moveModeId, setMoveModeId] = useState<BubbleToolId | null>(null);
  const [a11yAnnouncement, setA11yAnnouncement] = useState('');
  const pointerStatesRef = useRef<Partial<Record<BubbleToolId, PointerState>>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onResize = () => {
      setBucket(getViewportBucket(window.innerWidth));
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const slots = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return getDockSlots(window.innerWidth, window.innerHeight, bucket);
  }, [bucket]);

  const visibleIds = useMemo(
    () => bubbleIds.filter((id) => !hiddenBubbles.has(id as BubbleId)),
    [bubbleIds, hiddenBubbles]
  );

  const maxSlotIndex = useMemo(() => {
    return slots.reduce((max, candidate) => Math.max(max, candidate.slot.index), 0);
  }, [slots]);

  const assignments = useMemo(() => {
    const bucketAssignments = persisted[bucket] || {};
    const used = new Set<string>();
    const byId: Partial<Record<BubbleToolId, BubbleSlot>> = {};

    visibleIds.forEach((id, index) => {
      const parsed = bucketAssignments[id] ? parseSlotKey(bucketAssignments[id] as string) : null;
      const fallback: BubbleSlot = {
        edge: BUBBLE_DOCK_EDGE,
        index,
      };
      let candidate = parsed || fallback;
      if (candidate.edge !== BUBBLE_DOCK_EDGE) {
        candidate = { ...candidate, edge: BUBBLE_DOCK_EDGE };
      }
      if (candidate.index > maxSlotIndex) {
        candidate = { ...candidate, index: maxSlotIndex };
      }

      let key = toSlotKey(candidate);
      if (used.has(key)) {
        const free = slots.find((slot) => !used.has(toSlotKey(slot.slot)));
        if (free) {
          candidate = free.slot;
          key = toSlotKey(candidate);
        }
      }

      used.add(key);
      byId[id] = candidate;
    });

    return byId;
  }, [bucket, persisted, visibleIds, slots, maxSlotIndex]);

  const positionMap = useMemo(() => {
    const positions: Partial<Record<BubbleToolId, { x: number; y: number }>> = {};
    const slotByKey = new Map(slots.map((slot) => [toSlotKey(slot.slot), slot]));

    visibleIds.forEach((id) => {
      const live = livePositions[id];
      if (live) {
        positions[id] = live;
        return;
      }

      const assigned = assignments[id];
      if (!assigned) return;
      const slotPos = slotByKey.get(toSlotKey(assigned));
      if (slotPos) {
        positions[id] = { x: slotPos.x, y: slotPos.y };
      }
    });

    return positions;
  }, [assignments, livePositions, slots, visibleIds]);

  const persistSlot = useCallback(
    (id: BubbleToolId, slot: BubbleSlot) => {
      setPersisted((previous) => {
        const next: SlotPersistence = {
          mobile: { ...previous.mobile },
          desktop: { ...previous.desktop },
        };
        next[bucket][id] = toSlotKey(slot);
        savePersisted(next);
        return next;
      });
    },
    [bucket]
  );

  const clearLive = useCallback((id: BubbleToolId) => {
    setLivePositions((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);

  const resolveFreeSlot = useCallback(
    (id: BubbleToolId, preferred: BubbleSlot): BubbleSlot => {
      const occupied = new Set<string>();
      visibleIds.forEach((candidateId) => {
        if (candidateId === id) return;
        const assigned = assignments[candidateId];
        if (assigned) occupied.add(toSlotKey(assigned));
      });

      const preferredKey = toSlotKey(preferred);
      if (!occupied.has(preferredKey)) return preferred;

      const preferredPos = slots.find((slot) => toSlotKey(slot.slot) === preferredKey);
      const candidates = slots
        .filter((slot) => !occupied.has(toSlotKey(slot.slot)))
        .sort((a, b) => {
          if (!preferredPos) return 0;
          const da = (a.x - preferredPos.x) ** 2 + (a.y - preferredPos.y) ** 2;
          const db = (b.x - preferredPos.x) ** 2 + (b.y - preferredPos.y) ** 2;
          return da - db;
        });

      return candidates[0]?.slot || preferred;
    },
    [assignments, slots, visibleIds]
  );

  const moveByKeyboard = useCallback(
    (id: BubbleToolId, direction: 'left' | 'right' | 'up' | 'down') => {
      const current = assignments[id];
      if (!current) return;
      const next = getAdjacentSlot(current, direction, maxSlotIndex);
      const resolved = resolveFreeSlot(id, next);
      persistSlot(id, resolved);
      setA11yAnnouncement(`${id} bubble moved to ${resolved.edge} slot ${resolved.index + 1}`);
    },
    [assignments, maxSlotIndex, persistSlot, resolveFreeSlot]
  );

  const getBubbleProps = useCallback(
    (id: BubbleToolId) => {
      const position = positionMap[id] || { x: 0, y: 0 };
      const isDraggingBubble = movingBubbleId === id;

      const onPointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        const state: PointerState = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: position.x,
          originY: position.y,
          moved: false,
          dragging: false,
          timer: null,
        };

        const timer = window.setTimeout(() => {
          const active = pointerStatesRef.current[id];
          if (!active) return;
          active.dragging = true;
          setMovingBubbleId(id);
          setDragging(true);
        }, LONG_PRESS_MS);

        state.timer = timer;
        pointerStatesRef.current[id] = state;

        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Ignore pointer capture failures.
        }
      };

      const onPointerMove: React.PointerEventHandler<HTMLButtonElement> = (event) => {
        const state = pointerStatesRef.current[id];
        if (!state || state.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - state.startX;
        const deltaY = event.clientY - state.startY;
        if (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD) {
          state.moved = true;
        }

        if (!state.dragging) {
          if (state.moved && state.timer) {
            window.clearTimeout(state.timer);
            state.timer = null;
          }
          return;
        }

        const next = clampToViewport(
          state.originX + deltaX,
          state.originY + deltaY,
          window.innerWidth,
          window.innerHeight
        );
        setLivePositions((previous) => ({ ...previous, [id]: next }));
        checkDismissZoneHit(next.x, next.y, 60);
      };

      const onPointerUp: React.PointerEventHandler<HTMLButtonElement> = (event) => {
        const state = pointerStatesRef.current[id];
        if (!state || state.pointerId !== event.pointerId) return;

        if (state.timer) {
          window.clearTimeout(state.timer);
        }

        if (state.dragging) {
          const live = livePositions[id] || position;
          const dismissed = checkDismissZoneHit(live.x, live.y, 60);
          if (dismissed) {
            dismiss(id as BubbleId);
            clearLive(id);
          } else {
            const nearest = getNearestSlot(live.x, live.y, slots);
            if (nearest) {
              const resolved = resolveFreeSlot(id, nearest.slot);
              persistSlot(id, resolved);
            }
            clearLive(id);
          }
          setDragging(false);
          setMovingBubbleId(null);
        } else if (!state.moved) {
          onActivate(id);
        }

        delete pointerStatesRef.current[id];
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Ignore pointer release failures.
        }
      };

      const onPointerCancel: React.PointerEventHandler<HTMLButtonElement> = (event) => {
        const state = pointerStatesRef.current[id];
        if (!state || state.pointerId !== event.pointerId) return;
        if (state.timer) {
          window.clearTimeout(state.timer);
        }
        delete pointerStatesRef.current[id];
        clearLive(id);
        setDragging(false);
        setMovingBubbleId(null);
      };

      const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onActivate(id);
          return;
        }

        if (event.key === ' ') {
          event.preventDefault();
          setMoveModeId((previous) => (previous === id ? null : id));
          return;
        }

        if (event.key === 'Escape' && moveModeId === id) {
          event.preventDefault();
          setMoveModeId(null);
          return;
        }

        if (moveModeId !== id) return;

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          moveByKeyboard(id, 'left');
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          moveByKeyboard(id, 'right');
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveByKeyboard(id, 'up');
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveByKeyboard(id, 'down');
        }
      };

      return {
        position,
        isDragging: isDraggingBubble,
        isMoveMode: moveModeId === id,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onKeyDown,
      };
    },
    [
      positionMap,
      movingBubbleId,
      moveModeId,
      livePositions,
      slots,
      checkDismissZoneHit,
      dismiss,
      clearLive,
      onActivate,
      persistSlot,
      resolveFreeSlot,
      setDragging,
      moveByKeyboard,
    ]
  );

  return {
    visibleIds,
    getBubbleProps,
    a11yAnnouncement,
  };
};
