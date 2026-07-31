import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageIcon } from "@/common/Icons";
import RadialFabToggleIcon from "@/components/effects/RadialFabToggleIcon";
import { useAudio } from "@/hooks/useAudio";
import {
  clampPositionToViewport,
  getDockedPositionForViewport,
  getRadialMenuMetricsForWidth,
  MOBILE_BREAKPOINT,
} from "@/components/effects/lib/radialMenuLayout";
import "./RadialMenu.css";

interface RadialMenuProps {
  onOpenMessages?: () => void;
  onOpenQuiz?: () => void;
  onOpenSpin?: () => void;
}

const QuizIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const SpinIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="12" />
    <line x1="12" y1="12" x2="20" y2="16" />
  </svg>
);

const STORAGE_KEY = "radialMenu.position";
const DISCOVERED_KEY = "radialMenu.discovered";
const ITEM_COUNT = 3;
const DESKTOP_CHROME_CLEARANCE_TOP = 92;

const isMobileViewport = (): boolean =>
  typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;

const persistMenuPosition = (position: { x: number; y: number }) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignore quota / privacy-mode failures.
  }
};

const getSafeAreaInset = (
  edge: "top" | "right" | "bottom" | "left",
): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(
    `--radial-safe-${edge}`,
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
    chromeTop: isMobileViewport() ? 0 : DESKTOP_CHROME_CLEARANCE_TOP,
    insetTop: getSafeAreaInset("top"),
    insetRight: getSafeAreaInset("right"),
    insetBottom: getSafeAreaInset("bottom"),
    insetLeft: getSafeAreaInset("left"),
  };
};

const getMenuMetrics = () => getRadialMenuMetricsForWidth(window.innerWidth);

const readStoredPosition = (): { x: number; y: number } | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number")
      return null;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
};

const getInitialMenuPosition = () => {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  const stored = readStoredPosition();
  return stored
    ? clampToViewport(stored)
    : getDockedPositionForViewport(getViewportBox(), getMenuMetrics());
};

const clampToViewport = (pos: { x: number; y: number }) => {
  if (typeof window === "undefined") return pos;
  return clampPositionToViewport(pos, getViewportBox(), getMenuMetrics());
};

// Pick the quadrant with the most space so the fan opens inward, not off-screen.
const getFanQuadrant = (pos: {
  x: number;
  y: number;
}): "tl" | "tr" | "bl" | "br" => {
  if (typeof window === "undefined") return "tl";
  const viewport = getViewportBox();
  const { toggleOffset } = getMenuMetrics();
  const centerX = pos.x + toggleOffset;
  const centerY = pos.y + toggleOffset;
  const midpointX = viewport.offsetLeft + viewport.width / 2;
  const midpointY = viewport.offsetTop + viewport.height / 2;
  const isRight = centerX > midpointX;
  const isBottom = centerY > midpointY;
  // Fan into the opposite (more-space) quadrant.
  if (isBottom && isRight) return "tl";
  if (isBottom && !isRight) return "tr";
  if (!isBottom && isRight) return "bl";
  return "br";
};

const getInitialDiscoveryState = () => {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(DISCOVERED_KEY) === "1";
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
  const [isActive, setIsActive] = useState(false);
  const [menuPos, setMenuPos] = useState(getInitialMenuPosition);
  const [hasDiscovered, setHasDiscovered] = useState(getInitialDiscoveryState);
  const [isDragging, setIsDragging] = useState(false);
  const { playClick, playPop, playSwitch } = useAudio();

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragPointerIdRef = useRef<number | null>(null);
  const dragThreshold = 8;

  const fanQuadrant = getFanQuadrant(menuPos);

  const markDiscovered = useCallback(() => {
    setHasDiscovered((prev) => {
      if (!prev) {
        try {
          window.localStorage.setItem(DISCOVERED_KEY, "1");
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
      if (prev) {
        playClick();
      } else {
        playPop();
      }
      return !prev;
    });
    markDiscovered();
  }, [markDiscovered, playClick, playPop]);

  const closeMenu = useCallback(() => {
    setIsActive(false);
  }, []);

  const beginTogglePointer = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return;
      }

      dragStartRef.current = { x: event.clientX, y: event.clientY };
      dragPointerIdRef.current = event.pointerId;
      isDraggingRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const moveTogglePointer = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (dragPointerIdRef.current !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > dragThreshold && !isDraggingRef.current) {
        isDraggingRef.current = true;
        setIsDragging(true);
        setIsActive(false);
        event.preventDefault();
      }

      if (!isDraggingRef.current || !menuRef.current) {
        return;
      }

      event.preventDefault();
      const { toggleOffset } = getMenuMetrics();
      const newX = event.clientX - toggleOffset;
      const newY = event.clientY - toggleOffset;
      menuRef.current.style.left = `${newX}px`;
      menuRef.current.style.top = `${newY}px`;
    },
    [dragThreshold],
  );

  const finishTogglePointer = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (
        dragPointerIdRef.current !== null &&
        dragPointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (dragPointerIdRef.current === null) {
        return;
      }

      const wasDragging = isDraggingRef.current;

      if (!wasDragging) {
        toggleMenu();
      } else if (menuRef.current) {
        const left = parseFloat(menuRef.current.style.left || "0");
        const top = parseFloat(menuRef.current.style.top || "0");
        const clamped = clampToViewport({ x: left, y: top });
        menuRef.current.style.left = `${clamped.x}px`;
        menuRef.current.style.top = `${clamped.y}px`;
        setMenuPos(clamped);
        persistMenuPosition(clamped);
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      dragPointerIdRef.current = null;
    },
    [toggleMenu],
  );

  useEffect(() => {
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
      setMenuPos((prev) => clampToViewport(prev));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDownOutside);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu]);

  const handleMenuItemClick = (callback?: () => void) => {
    playSwitch();
    callback?.();
    setIsActive(false);
  };

  const menuItems = [
    {
      colorClass: "teal",
      label: "Messages",
      description: "Chat, notes, and check-ins",
      onClick: () => handleMenuItemClick(onOpenMessages),
      icon: <MessageIcon size={20} style={{ color: "white" }} />,
    },
    {
      colorClass: "violet",
      label: "Quiz",
      description: "Take the retro personality quiz",
      onClick: () => handleMenuItemClick(onOpenQuiz),
      icon: <QuizIcon />,
    },
    {
      colorClass: "amber",
      label: "Spin",
      description: "Swipe to merge, spin to pick a movie",
      onClick: () => handleMenuItemClick(onOpenSpin),
      icon: <SpinIcon />,
    },
  ] as const;

  const toggleLabel = isActive ? "Close quick actions" : "Open quick actions";
  const toggleHint = "Drag to reposition • Click to toggle quick actions";

  return (
    <div
      ref={menuRef}
      className={`menu menu--fan-${fanQuadrant} ${isActive ? "active" : ""}`}
      style={{
        left: `${menuPos.x}px`,
        top: `${menuPos.y}px`,
        ["--item-count" as string]: ITEM_COUNT,
      }}
    >
      <button
        type="button"
        className={`toggle ${isActive ? "toggle--active" : ""} ${isDragging ? "toggle--dragging" : ""} ${!hasDiscovered ? "discover-pulse" : ""}`}
        aria-label={`${toggleLabel}. ${toggleHint}`}
        title={toggleHint}
        aria-expanded={isActive}
        aria-haspopup="menu"
        onPointerDown={beginTogglePointer}
        onPointerMove={moveTogglePointer}
        onPointerUp={finishTogglePointer}
        onPointerCancel={finishTogglePointer}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleMenu();
          }
        }}
      >
        <RadialFabToggleIcon isActive={isActive} />
      </button>

      <ul role="menu" aria-label="Quick actions">
        {menuItems.map((item, index) => (
          <li
            key={item.label}
            style={{ "--i": index } as React.CSSProperties}
            className={`${item.colorClass} round-button`}
          >
            <button
              type="button"
              onClick={item.onClick}
              aria-label={`${item.label}. ${item.description}`}
              title={item.label}
              className="menu-item-button"
              role="menuitem"
            >
              <span className="menu-item-button__icon">{item.icon}</span>
              <span className="menu-item-button__tooltip" aria-hidden="true">
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RadialMenu;
