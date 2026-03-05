import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'hiddenBubbles';
const DISMISS_ZONE_RADIUS = 60;

export type BubbleId = 'messages' | 'spin' | 'snake' | 'quiz' | 'matchmaker';

const BUBBLE_LABELS: Record<BubbleId, { emoji: string; label: string }> = {
  messages: { emoji: '💬', label: 'Messages' },
  spin: { emoji: '🎰', label: 'Spin Wheel' },
  snake: { emoji: '🐍', label: 'Snake' },
  quiz: { emoji: '❓', label: 'Quiz' },
  matchmaker: { emoji: '💕', label: 'Matchmaker' },
};

interface BubbleDismissContextValue {
  hiddenBubbles: Set<BubbleId>;
  isDragging: boolean;
  isHoveringDismiss: boolean;
  dismiss: (id: BubbleId) => void;
  restore: (id: BubbleId) => void;
  restoreAll: () => void;
  isHidden: (id: BubbleId) => boolean;
  setDragging: (dragging: boolean) => void;
  checkDismissZoneHit: (bubbleX: number, bubbleY: number, bubbleSize: number) => boolean;
  bubbleLabels: typeof BUBBLE_LABELS;
}

const BubbleDismissContext = createContext<BubbleDismissContextValue | null>(null);

function loadHidden(): Set<BubbleId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as BubbleId[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveHidden(set: Set<BubbleId>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export const BubbleDismissProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hiddenBubbles, setHiddenBubbles] = useState<Set<BubbleId>>(loadHidden);
  const [isDragging, setIsDraggingState] = useState(false);
  const [isHoveringDismiss, setIsHoveringDismiss] = useState(false);
  const dismissZoneRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update dismiss zone position on every render (bottom center)
  if (typeof window !== 'undefined') {
    dismissZoneRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight - 50,
    };
  }

  const dismiss = useCallback((id: BubbleId) => {
    setHiddenBubbles((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveHidden(next);
      return next;
    });
  }, []);

  const restore = useCallback((id: BubbleId) => {
    setHiddenBubbles((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveHidden(next);
      return next;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setHiddenBubbles(new Set());
    saveHidden(new Set());
  }, []);

  const isHidden = useCallback((id: BubbleId) => hiddenBubbles.has(id), [hiddenBubbles]);

  const setDragging = useCallback((dragging: boolean) => {
    setIsDraggingState(dragging);
    if (!dragging) setIsHoveringDismiss(false);
  }, []);

  const checkDismissZoneHit = useCallback(
    (bubbleX: number, bubbleY: number, bubbleSize: number) => {
      const bubbleCenterX = bubbleX + bubbleSize / 2;
      const bubbleCenterY = bubbleY + bubbleSize / 2;
      const zoneX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
      const zoneY = typeof window !== 'undefined' ? window.innerHeight - 50 : 0;
      const dist = Math.sqrt((bubbleCenterX - zoneX) ** 2 + (bubbleCenterY - zoneY) ** 2);
      const hit = dist < DISMISS_ZONE_RADIUS;
      setIsHoveringDismiss(hit);
      return hit;
    },
    []
  );

  const value = useMemo(
    () => ({
      hiddenBubbles,
      isDragging,
      isHoveringDismiss,
      dismiss,
      restore,
      restoreAll,
      isHidden,
      setDragging,
      checkDismissZoneHit,
      bubbleLabels: BUBBLE_LABELS,
    }),
    [
      hiddenBubbles,
      isDragging,
      isHoveringDismiss,
      dismiss,
      restore,
      restoreAll,
      isHidden,
      setDragging,
      checkDismissZoneHit,
    ]
  );

  return <BubbleDismissContext.Provider value={value}>{children}</BubbleDismissContext.Provider>;
};

export function useBubbleDismiss() {
  const ctx = useContext(BubbleDismissContext);
  if (!ctx) throw new Error('useBubbleDismiss must be used within BubbleDismissProvider');
  return ctx;
}
