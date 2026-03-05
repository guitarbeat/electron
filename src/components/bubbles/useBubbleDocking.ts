import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BubbleId, useBubbleDismiss } from '@/context/BubbleDismissContext;
import {
  BubbleToolId,
  BubbleViewportBucket,
  clampToViewport,
  getDockSlots,
  getViewportBucket,
} from './bubbleLayout';

const STORAGE_KEY = 'bubbleDocking:v2';
const LONG_PRESS_MS = 180;
const MOVE_THRESHOLD = 5;
const KEYBOARD_MOVE_STEP = 28;

type PositionPersistence = Record<
  BubbleViewportBucket,
  Partial<Record<BubbleToolId, { x: number; y: number }>>
>;

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

const getEmptyPersistence = (): PositionPersistence => ({ mobile: {}, desktop: {} });

const loadPersisted = (): PositionPersistence => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getEmptyPersistence();
    const parsed = JSON.parse(raw) as PositionPersistence;
    return {
      mobile: parsed.mobile || {},
      desktop: parsed.desktop || {},
    };
  } catch {
    return getEmptyPersistence();
  }
};

const savePersisted = (value: PositionPersistence) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const useBubbleDocking = ({ bubbleIds, onActivate }: UseBubbleDockingProps) => {
  const { hiddenBubbles, setDragging, checkDismissZoneHit, dismiss } = useBubbleDismiss();
  const [bucket, setBucket] = useState<BubbleViewportBucket>(() =>
    typeof window === 'undefined' ? 'desktop' : getViewportBucket(window.innerWidth)
  );
  const [persisted, setPersisted] = useState<PositionPersistence>(() => loadPersisted());
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

  const visibleIds = useMemo(
    () => bubbleIds.filter((id) => !hiddenBubbles.has(id as BubbleId)),
    [bubbleIds, hiddenBubbles]
  );

  const defaultPositions = useMemo(() => {
    if (typeof window === 'undefined') return {} as Partial<Record<BubbleToolId, { x: number; y: number }>>;

    const slots = getDockSlots(window.innerWidth, window.innerHeight, bucket);
    const byId: Partial<Record<BubbleToolId, { x: number; y: number }>> = {};

    visibleIds.forEach((id, index) => {
      const slot = slots[index % slots.length];
      byId[id] = slot
        ? { x: slot.x, y: slot.y }
        : clampToViewport(16 + index * 14, 120 + index * 14, window.innerWidth, window.innerHeight);
    });

    return byId;
  }, [bucket, visibleIds]);

  const positionMap = useMemo(() => {
    const positions: Partial<Record<BubbleToolId, { x: number; y: number }>> = {};

    visibleIds.forEach((id) => {
      const live = livePositions[id];
      if (live) {
        positions[id] = live;
        return;
      }

      const saved = persisted[bucket]?.[id];
      if (saved && typeof window !== 'undefined') {
        positions[id] = clampToViewport(saved.x, saved.y, window.innerWidth, window.innerHeight);
        return;
      }

      const fallback = defaultPositions[id];
      if (fallback) {
        positions[id] = fallback;
      }
    });

    return positions;
  }, [defaultPositions, livePositions, persisted, bucket, visibleIds]);

  const persistPosition = useCallback(
    (id: BubbleToolId, position: { x: number; y: number }) => {
      if (typeof window === 'undefined') return;

      const clamped = clampToViewport(position.x, position.y, window.innerWidth, window.innerHeight);

      setPersisted((previous) => {
        const next: PositionPersistence = {
          mobile: { ...previous.mobile },
          desktop: { ...previous.desktop },
        };
        next[bucket][id] = clamped;
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

  const moveByKeyboard = useCallback(
    (id: BubbleToolId, direction: 'left' | 'right' | 'up' | 'down') => {
      if (typeof window === 'undefined') return;
      const current = positionMap[id] || defaultPositions[id];
      if (!current) return;

      const deltaX = direction === 'left' ? -KEYBOARD_MOVE_STEP : direction === 'right' ? KEYBOARD_MOVE_STEP : 0;
      const deltaY = direction === 'up' ? -KEYBOARD_MOVE_STEP : direction === 'down' ? KEYBOARD_MOVE_STEP : 0;
      const next = clampToViewport(
        current.x + deltaX,
        current.y + deltaY,
        window.innerWidth,
        window.innerHeight
      );

      persistPosition(id, next);
      setA11yAnnouncement(`${id} bubble moved to x ${Math.round(next.x)}, y ${Math.round(next.y)}`);
    },
    [defaultPositions, persistPosition, positionMap]
  );

  const getBubbleProps = useCallback(
    (id: BubbleToolId) => {
      const position = positionMap[id] || defaultPositions[id] || { x: 16, y: 120 };
      const isDraggingBubble = movingBubbleId === id;

      const startDragging = (state: PointerState) => {
        if (state.dragging) return;
        state.dragging = true;
        if (state.timer) {
          window.clearTimeout(state.timer);
          state.timer = null;
        }
        setMovingBubbleId(id);
        setDragging(true);
      };

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
          startDragging(active);
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
          if (!state.moved) {
            return;
          }
          startDragging(state);
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
            persistPosition(id, live);
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
      defaultPositions,
      movingBubbleId,
      moveModeId,
      livePositions,
      checkDismissZoneHit,
      dismiss,
      clearLive,
      onActivate,
      persistPosition,
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
