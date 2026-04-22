import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageIcon } from '@/common/icons';
import './RadialMenu.css';

interface RadialMenuProps {
  onOpenMessages?: () => void;
  onOpenMemories?: () => void;
  onOpenQuiz?: () => void;
  onOpenSpin?: () => void;
  onOpenFavorites?: () => void;
}

// SVG Icons for the menu
const MemoriesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const QuizIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const SpinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="12" />
    <line x1="12" y1="12" x2="20" y2="16" />
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const STORAGE_KEY = 'radialMenu.position';
const DISCOVERED_KEY = 'radialMenu.discovered';
const MOBILE_BREAKPOINT = 600;
const TOGGLE_DRAG_THRESHOLD_PX = 8;
const TOGGLE_CLICK_THRESHOLD_MS = 300;
const TOGGLE_OFFSET = 100;

const isMobileViewport = (): boolean =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;

const getDockedPosition = () => ({
  // Bottom-right dock with safe-area-friendly margins.
  x: window.innerWidth - 96,
  y: window.innerHeight - 110,
});

const readStoredPosition = (): { x: number; y: number } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
};

const clampToViewport = (pos: { x: number; y: number }) => {
  if (typeof window === 'undefined') return pos;
  // Menu toggle is ~80px wide; keep it fully on-screen with a small margin.
  const margin = 8;
  const maxX = Math.max(margin, window.innerWidth - 80 - margin);
  const maxY = Math.max(margin, window.innerHeight - 80 - margin);
  return {
    x: Math.min(Math.max(pos.x, margin), maxX),
    y: Math.min(Math.max(pos.y, margin), maxY),
  };
};

const getInitialMenuPosition = () => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }

  const stored = isMobileViewport() ? null : readStoredPosition();
  return stored ? clampToViewport(stored) : getDockedPosition();
};

const getInitialDiscoveryState = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(DISCOVERED_KEY) === '1';
  } catch {
    return false;
  }
};

const RadialMenu: React.FC<RadialMenuProps> = ({
  onOpenMessages,
  onOpenMemories,
  onOpenQuiz,
  onOpenSpin,
  onOpenFavorites,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [menuPos, setMenuPos] = useState(getInitialMenuPosition);
  const [hasDiscovered, setHasDiscovered] = useState(getInitialDiscoveryState);

  const activePointerIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartTimeRef = useRef(0);
  const suppressClickRef = useRef(false);

  const markDiscovered = useCallback(() => {
    setHasDiscovered((prev) => {
      if (!prev) {
        try {
          window.localStorage.setItem(DISCOVERED_KEY, '1');
        } catch {
          // Ignore quota / privacy-mode failures.
        }
      }
      return true;
    });
  }, []);

  const toggleMenu = useCallback(() => {
    setIsActive((prev) => !prev);
    markDiscovered();
  }, [markDiscovered]);

  const persistMenuPosition = useCallback(() => {
    if (!menuRef.current || isMobileViewport()) {
      return;
    }

    const left = parseFloat(menuRef.current.style.left || '0');
    const top = parseFloat(menuRef.current.style.top || '0');

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ x: left, y: top })
      );
    } catch {
      // Ignore quota / privacy-mode failures.
    }
  }, []);

  const resetPointerInteraction = useCallback(() => {
    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    dragStartTimeRef.current = 0;
  }, []);

  const suppressNextClick = useCallback(() => {
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // Re-dock on mobile so the toggle stays in the corner across rotations.
      setMenuPos((prev) =>
        isMobileViewport() ? getDockedPosition() : clampToViewport(prev)
      );
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTogglePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      activePointerIdRef.current = event.pointerId;
      dragStartPosRef.current = { x: event.clientX, y: event.clientY };
      dragStartTimeRef.current = Date.now();
      isDraggingRef.current = false;
      suppressClickRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    []
  );

  const handleTogglePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragStartPosRef.current.x;
      const deltaY = event.clientY - dragStartPosRef.current.y;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > TOGGLE_DRAG_THRESHOLD_PX && !isDraggingRef.current) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current && !isMobileViewport()) {
        const nextPos = clampToViewport({
          x: event.clientX - TOGGLE_OFFSET,
          y: event.clientY - TOGGLE_OFFSET,
        });
        setMenuPos(nextPos);
      }
    },
    []
  );

  const handleTogglePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const clickDuration =
        dragStartTimeRef.current > 0
          ? Date.now() - dragStartTimeRef.current
          : Number.POSITIVE_INFINITY;
      const wasDragging = isDraggingRef.current;

      suppressNextClick();

      if (!wasDragging && clickDuration < TOGGLE_CLICK_THRESHOLD_MS) {
        toggleMenu();
      } else if (wasDragging) {
        persistMenuPosition();
      }

      resetPointerInteraction();
    },
    [persistMenuPosition, resetPointerInteraction, suppressNextClick, toggleMenu]
  );

  const handleTogglePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      resetPointerInteraction();
    },
    [resetPointerInteraction]
  );

  const handleToggleClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    toggleMenu();
  }, [toggleMenu]);

  const handleMenuItemClick = (callback?: () => void) => {
    callback?.();
    setIsActive(false);
  };

  const menuItems = [
    {
      index: 0,
      colorClass: 'green',
      label: 'Open messages',
      onClick: () => handleMenuItemClick(onOpenMessages),
      icon: <MessageIcon size={20} style={{ color: 'white' }} />,
    },
    {
      index: 1,
      colorClass: 'blue',
      label: 'Open memories',
      onClick: () => handleMenuItemClick(onOpenMemories),
      icon: <MemoriesIcon />,
    },
    {
      index: 2,
      colorClass: 'purple',
      label: 'Open quiz',
      onClick: () => handleMenuItemClick(onOpenQuiz),
      icon: <QuizIcon />,
    },
    {
      index: 3,
      colorClass: 'orange',
      label: 'Spin & Match',
      onClick: () => handleMenuItemClick(onOpenSpin),
      icon: <SpinIcon />,
    },
    {
      index: 4,
      colorClass: 'red',
      label: 'Open favorites',
      onClick: () => handleMenuItemClick(onOpenFavorites),
      icon: <StarIcon />,
    },
  ];

  return (
    <div
      ref={menuRef}
      className={`menu ${isActive ? 'active' : ''}`}
      style={{
        left: `${menuPos.x}px`,
        top: `${menuPos.y}px`,
      }}
    >
      <button
        type="button"
        className={`toggle ${!hasDiscovered ? 'discover-pulse' : ''}`}
        aria-label="Toggle quick actions"
        aria-expanded={isActive}
        onClick={handleToggleClick}
        onPointerDown={handleTogglePointerDown}
        onPointerMove={handleTogglePointerMove}
        onPointerUp={handleTogglePointerUp}
        onPointerCancel={handleTogglePointerCancel}
      >
        <span className="rotate">+</span>
      </button>

      <ul>
        {menuItems.map((item) => (
          <li
            key={item.index}
            style={{ '--i': item.index } as React.CSSProperties}
            className={`${item.colorClass} round-button`}
          >
            <button
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
              title={item.label}
              className="menu-item-button"
            >
              {item.icon}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RadialMenu;
