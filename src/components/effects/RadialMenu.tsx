import React, { useEffect, useRef, useState } from 'react';
import { MessageIcon } from '@/common/icons';
import './RadialMenu.css';

export type BackgroundType = 'moire' | 'water';

interface RadialMenuProps {
  onOpenMessages?: () => void;
  onBackgroundChange?: (bg: BackgroundType) => void;
  currentBackground?: BackgroundType;
}

// SVG Icons for the menu
const WaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
  </svg>
);

const CirclePatternIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const RadialMenu: React.FC<RadialMenuProps> = ({ 
  onOpenMessages, 
  onBackgroundChange,
  currentBackground = 'moire'
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartTimeRef = useRef(0);
  const dragThreshold = 8;
  const clickTimeThreshold = 300;

  useEffect(() => {
    // Initialize menu position (bottom right area)
    const initialX = window.innerWidth - 160;
    const initialY = window.innerHeight - 160;
    setMenuPos({ x: initialX, y: initialY });

    const handleMouseDown = (e: MouseEvent) => {
      if (!toggleRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      e.stopPropagation();

      dragStartPosRef.current = { x: e.pageX, y: e.pageY };
      dragStartTimeRef.current = Date.now();
      isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (dragStartTimeRef.current === 0) return;

      const deltaX = e.pageX - dragStartPosRef.current.x;
      const deltaY = e.pageY - dragStartPosRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > dragThreshold && !isDraggingRef.current) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current && menuRef.current) {
        const newX = e.pageX - 100;
        const newY = e.pageY - 100;
        menuRef.current.style.left = `${newX}px`;
        menuRef.current.style.top = `${newY}px`;
        setMenuPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (dragStartTimeRef.current > 0) {
        const clickDuration = Date.now() - dragStartTimeRef.current;

        if (!isDraggingRef.current && clickDuration < clickTimeThreshold) {
          setIsActive((prev) => !prev);
        }

        isDraggingRef.current = false;
        dragStartTimeRef.current = 0;
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMenuItemClick = (callback?: () => void) => {
    callback?.();
    setIsActive(false);
  };

  const toggleBackground = () => {
    const newBg: BackgroundType = currentBackground === 'moire' ? 'water' : 'moire';
    onBackgroundChange?.(newBg);
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
      label: currentBackground === 'moire' ? 'Switch to Water' : 'Switch to Moire',
      onClick: toggleBackground,
      icon: currentBackground === 'moire' ? <WaveIcon /> : <CirclePatternIcon />,
    },
    {
      index: 2,
      colorClass: 'purple',
      label: 'Settings',
      onClick: () => handleMenuItemClick(),
      icon: <SettingsIcon />,
    },
    {
      index: 3,
      colorClass: 'orange',
      label: 'Favorites',
      onClick: () => handleMenuItemClick(),
      icon: <StarIcon />,
    },
    {
      index: 4,
      colorClass: 'red',
      label: 'Help',
      onClick: () => handleMenuItemClick(),
      icon: <HelpIcon />,
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
      <div
        ref={toggleRef}
        className="toggle"
        role="button"
        tabIndex={0}
        aria-label="Toggle menu"
        aria-expanded={isActive}
      >
        <span className="rotate">+</span>
      </div>

      <ul>
        {menuItems.map((item) => (
          <li
            key={item.index}
            style={{ '--i': item.index } as React.CSSProperties}
            className={`${item.colorClass} round-button`}
          >
            <button
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
