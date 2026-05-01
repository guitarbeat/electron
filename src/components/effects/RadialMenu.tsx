import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CrossIcon, MessageIcon, QuickActionsIcon } from '@/common/Icons';
import {
  clampPositionToViewport,
  getDockedPositionForViewport,
  getRadialMenuMetricsForWidth,
  MOBILE_BREAKPOINT,
} from '@/components/effects/lib/radialMenuLayout';
import './RadialMenu.css';

interface RadialMenuProps {
  onOpenMessages?: () => void;
  onOpenQuiz?: () => void;
  onOpenSpin?: () => void;
}

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

const STORAGE_KEY = 'radialMenu.position';
const DISCOVERED_KEY = 'radialMenu.discovered';
const ITEM_COUNT = 3;

const isMobileViewport = (): boolean =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;

const isStandaloneDisplayMode = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

const shouldUseDockedLayout = (): boolean =>
  typeof window !== 'undefined' &&
  (isStandaloneDisplayMode() ||
    window.matchMedia('(pointer: coarse)').matches ||
    isMobileViewport());

const getSafeAreaInset = (edge: 'top' | 'right' | 'bottom' | 'left'): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(
    `--radial-safe-${edge}`
  );
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getViewportBox = () => {
  const visualViewport = window.visualViewport;

  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
    offsetLeft: visualViewport?.offsetLeft ?? 0,
    offsetTop: visualViewport?.offsetTop ?? 0,
    insetTop: getSafeAreaInset('top'),
    insetRight: getSafeAreaInset('right'),
    insetBottom: getSafeAreaInset('bottom'),
    insetLeft: getSafeAreaInset('left'),
  };
};

const getMenuMetrics = () => getRadialMenuMetricsForWidth(window.innerWidth);

const getDockedPosition = () => {
  return getDockedPositionForViewport(getViewportBox(), getMenuMetrics());
};

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
  return clampPositionToViewport(pos, getViewportBox(), getMenuMetrics());
};

// Pick the quadrant with the most space so the fan opens inward, not off-screen.
const getFanQuadrant = (pos: { x: number; y: number }): 'tl' | 'tr' | 'bl' | 'br' => {
  if (typeof window === 'undefined') return 'tl';
  const viewport = getViewportBox();
  const { toggleOffset } = getMenuMetrics();
  const centerX = pos.x + toggleOffset;
  const centerY = pos.y + toggleOffset;
  const midpointX = viewport.offsetLeft + viewport.width / 2;
  const midpointY = viewport.offsetTop + viewport.height / 2;
  const isRight = centerX > midpointX;
  const isBottom = centerY > midpointY;
  // Fan into the opposite (more-space) quadrant.
  if (isBottom && isRight) return 'tl';
  if (isBottom && !isRight) return 'tr';
  if (!isBottom && isRight) return 'bl';
  return 'br';
};

const getInitialMenuPosition = () => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }

  const stored = shouldUseDockedLayout() ? null : readStoredPosition();
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
  onOpenQuiz,
  onOpenSpin,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [menuPos, setMenuPos] = useState(getInitialMenuPosition);
  const [hasDiscovered, setHasDiscovered] = useState(getInitialDiscoveryState);
  const [highlightedItemIndex, setHighlightedItemIndex] = useState<number>(0);

  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartTimeRef = useRef(0);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragThreshold = 8;
  const clickTimeThreshold = 260;

  const fanQuadrant = getFanQuadrant(menuPos);

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
    setMenuPos((prev) => clampToViewport(prev));
    setIsActive((prev) => {
      const next = !prev;
      if (next) {
        setHighlightedItemIndex(0);
      }
      return next;
    });
    markDiscovered();
  }, [markDiscovered]);

  const closeMenu = useCallback(() => {
    setIsActive(false);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!toggleRef.current?.contains(e.target as Node) || shouldUseDockedLayout()) return;

      e.preventDefault();
      e.stopPropagation();

      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      dragStartTimeRef.current = Date.now();
      dragPointerIdRef.current = e.pointerId;
      isDraggingRef.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (dragStartTimeRef.current === 0 || dragPointerIdRef.current !== e.pointerId) return;

      const deltaX = e.clientX - dragStartPosRef.current.x;
      const deltaY = e.clientY - dragStartPosRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > dragThreshold && !isDraggingRef.current) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current && menuRef.current) {
        const { toggleOffset } = getMenuMetrics();
        const newX = e.clientX - toggleOffset;
        const newY = e.clientY - toggleOffset;
        menuRef.current.style.left = `${newX}px`;
        menuRef.current.style.top = `${newY}px`;
        setMenuPos({ x: newX, y: newY });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragPointerIdRef.current !== null && dragPointerIdRef.current !== e.pointerId) {
        return;
      }

      if (dragStartTimeRef.current > 0) {
        const clickDuration = Date.now() - dragStartTimeRef.current;
        const wasDragging = isDraggingRef.current;

        if (!wasDragging && clickDuration < clickTimeThreshold) {
          toggleMenu();
        }

        if (wasDragging && menuRef.current) {
          // Clamp final position to keep the fan on-screen.
          const left = parseFloat(menuRef.current.style.left || '0');
          const top = parseFloat(menuRef.current.style.top || '0');
          const clamped = clampToViewport({ x: left, y: top });
          menuRef.current.style.left = `${clamped.x}px`;
          menuRef.current.style.top = `${clamped.y}px`;
          setMenuPos(clamped);

          if (!shouldUseDockedLayout()) {
            // Persist final position so it survives reloads (desktop only —
            // docked layouts always snap back to the bottom-right).
            try {
              window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(clamped)
              );
            } catch {
              // Ignore quota / privacy-mode failures.
            }
          }
        }

        isDraggingRef.current = false;
        dragStartTimeRef.current = 0;
        dragPointerIdRef.current = null;
      }
    };

    const handlePointerDownOutside = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!menuRef.current?.contains(target)) {
        closeMenu();
      }
    };

    const handleResize = () => {
      // Re-dock in compact/standalone layouts so the toggle stays in the corner
      // across rotations and dynamic viewport changes.
      setMenuPos((prev) =>
        shouldUseDockedLayout() ? getDockedPosition() : clampToViewport(prev)
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    document.addEventListener('pointerdown', handlePointerDownOutside);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu, toggleMenu]);

  const handleMenuItemClick = (callback?: () => void) => {
    callback?.();
    setIsActive(false);
  };

  const menuItems = [
    {
      index: 0,
      colorClass: 'teal',
      label: 'Messages',
      description: 'Chat, notes, and check-ins',
      onClick: () => handleMenuItemClick(onOpenMessages),
      icon: <MessageIcon size={20} style={{ color: 'white' }} />,
    },
    {
      index: 1,
      colorClass: 'violet',
      label: 'Quiz',
      description: 'Run the couple compatibility quiz',
      onClick: () => handleMenuItemClick(onOpenQuiz),
      icon: <QuizIcon />,
    },
    {
      index: 2,
      colorClass: 'amber',
      label: 'Spin',
      description: 'Launch the movie picker wheel',
      onClick: () => handleMenuItemClick(onOpenSpin),
      icon: <SpinIcon />,
    },
  ];

  const highlightedItem = menuItems[highlightedItemIndex] ?? menuItems[0];

  return (
    <div
      ref={menuRef}
      className={`menu menu--fan-${fanQuadrant} ${isActive ? 'active' : ''}`}
      style={{
        left: `${menuPos.x}px`,
        top: `${menuPos.y}px`,
        ['--item-count' as string]: ITEM_COUNT,
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        className={`toggle ${isActive ? 'toggle--active' : ''} ${!hasDiscovered ? 'discover-pulse' : ''}`}
        aria-label={isActive ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={isActive}
        aria-haspopup="menu"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleMenu();
          }
        }}
      >
        {isActive ? <CrossIcon size={18} /> : <QuickActionsIcon size={18} />}
      </button>

      {isActive ? (
        <div
          className={`menu-context-bubble menu-context-bubble--${highlightedItem.colorClass}`}
          aria-hidden="true"
        >
          <span className="menu-context-bubble__eyebrow">Quick action</span>
          <span className="menu-context-bubble__title-row">
            <span className="menu-context-bubble__icon">{highlightedItem.icon}</span>
            <span className="menu-context-bubble__title-copy">
              <strong>{highlightedItem.label}</strong>
              <span>{highlightedItem.description}</span>
            </span>
          </span>
        </div>
      ) : null}

      <ul role="menu" aria-label="Quick actions">
        {menuItems.map((item) => (
          <li
            key={item.index}
            style={{ '--i': item.index } as React.CSSProperties}
            className={`${item.colorClass} round-button`}
          >
            <button
              type="button"
              onClick={item.onClick}
              onMouseEnter={() => setHighlightedItemIndex(item.index)}
              onFocus={() => setHighlightedItemIndex(item.index)}
              aria-label={item.label}
              title={item.label}
              className="menu-item-button"
              role="menuitem"
            >
              <span className="menu-item-button__icon">{item.icon}</span>
              <span className="menu-item-button__tooltip" aria-hidden="true">
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RadialMenu;
