import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageIcon } from '@/common/Icons';
import './RadialMenu.css';

interface RadialMenuProps {
  onOpenMessages?: () => void;
  onOpenMemories?: () => void;
  onOpenQuiz?: () => void;
  onOpenSpin?: () => void;
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

const BubbleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="7.5" fill="currentColor" fillOpacity="0.18" />
    <path
      d="M12 5.75a6.25 6.25 0 1 1-5.09 9.87L5.5 19l3.63-1.16A6.25 6.25 0 1 1 12 5.75Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.25" cy="11.9" r="1" fill="currentColor" />
    <circle cx="12" cy="11.9" r="1" fill="currentColor" />
    <circle cx="14.75" cy="11.9" r="1" fill="currentColor" />
  </svg>
);

const STORAGE_KEY = 'radialMenu.position';
const DISCOVERED_KEY = 'radialMenu.discovered';
const MOBILE_BREAKPOINT = 600;

// The menu container is 200×200 (160×160 on mobile). The toggle sits centered;
// bubbles fan out to the container's edge. So the full bounding radius from the
// center of the toggle is half the container size + a little safety padding.
const TOGGLE_OFFSET = 100; // half of container (200/2) — used for left/top → center mapping
const FAN_RADIUS_DESKTOP = 110; // bubbles + halo
const FAN_RADIUS_MOBILE = 90;
const SAFE_MARGIN = 10;
const ITEM_COUNT = 4;

const isMobileViewport = (): boolean =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;

const getFanRadius = (): number =>
  isMobileViewport() ? FAN_RADIUS_MOBILE : FAN_RADIUS_DESKTOP;

const getDockedPosition = () => {
  // Position the menu so the entire fan stays on screen at the bottom-right.
  const radius = getFanRadius();
  const margin = SAFE_MARGIN;
  // menuPos is the container's top-left; toggle center sits at +TOGGLE_OFFSET.
  const x = window.innerWidth - TOGGLE_OFFSET - radius - margin;
  const y = window.innerHeight - TOGGLE_OFFSET - radius - margin;
  return { x, y };
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
  // Inset by the full fan radius so bubbles never clip off-screen.
  const radius = getFanRadius();
  const margin = SAFE_MARGIN;
  const minX = margin - TOGGLE_OFFSET + radius;
  const maxX = window.innerWidth - TOGGLE_OFFSET - radius - margin;
  const minY = margin - TOGGLE_OFFSET + radius;
  const maxY = window.innerHeight - TOGGLE_OFFSET - radius - margin;
  return {
    x: Math.min(Math.max(pos.x, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(pos.y, minY), Math.max(minY, maxY)),
  };
};

// Pick the quadrant with the most space so the fan opens inward, not off-screen.
const getFanQuadrant = (pos: { x: number; y: number }): 'tl' | 'tr' | 'bl' | 'br' => {
  if (typeof window === 'undefined') return 'tl';
  const centerX = pos.x + TOGGLE_OFFSET;
  const centerY = pos.y + TOGGLE_OFFSET;
  const isRight = centerX > window.innerWidth / 2;
  const isBottom = centerY > window.innerHeight / 2;
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
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [menuPos, setMenuPos] = useState(getInitialMenuPosition);
  const [hasDiscovered, setHasDiscovered] = useState(getInitialDiscoveryState);

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
    setIsActive((prev) => !prev);
    markDiscovered();
  }, [markDiscovered]);

  const closeMenu = useCallback(() => {
    setIsActive(false);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!toggleRef.current?.contains(e.target as Node)) return;

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
        const newX = e.clientX - TOGGLE_OFFSET;
        const newY = e.clientY - TOGGLE_OFFSET;
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

          if (!isMobileViewport()) {
            // Persist final position so it survives reloads (desktop only —
            // mobile always re-docks bottom-right).
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
      // Re-dock on mobile so the toggle stays in the corner across rotations.
      setMenuPos((prev) =>
        isMobileViewport() ? getDockedPosition() : clampToViewport(prev)
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('resize', handleResize);
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
      description: 'Chat and check-ins',
      onClick: () => handleMenuItemClick(onOpenMessages),
      icon: <MessageIcon size={20} style={{ color: 'white' }} />,
    },
    {
      index: 1,
      colorClass: 'blue',
      label: 'Memories',
      description: 'Shared notes and moments',
      onClick: () => handleMenuItemClick(onOpenMemories),
      icon: <MemoriesIcon />,
    },
    {
      index: 2,
      colorClass: 'violet',
      label: 'Quiz',
      description: 'Personality and couple quiz',
      onClick: () => handleMenuItemClick(onOpenQuiz),
      icon: <QuizIcon />,
    },
    {
      index: 3,
      colorClass: 'amber',
      label: 'Spin',
      description: 'Spin and match a movie',
      onClick: () => handleMenuItemClick(onOpenSpin),
      icon: <SpinIcon />,
    },
  ];

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
        className={`toggle ${!hasDiscovered ? 'discover-pulse' : ''}`}
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
        <span className="toggle__glow" aria-hidden="true" />
        <span className="toggle__icon">
          <BubbleIcon />
        </span>
        <span className="toggle__label">{isActive ? 'Close' : 'Quick actions'}</span>
      </button>

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
