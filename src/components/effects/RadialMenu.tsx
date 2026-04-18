import React, { useEffect, useRef, useState } from 'react';
import { MessageIcon } from '@/common/icons';
import './RadialMenu.css';

export type BackgroundType = 'moire' | 'water';

interface RadialMenuProps {
  onOpenMessages?: () => void;
  onBackgroundChange?: (bg: BackgroundType) => void;
  currentBackground?: BackgroundType;
}

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
  const initialElementPosRef = useRef({ x: 0, y: 0 });
  const dragThreshold = 8;
  const clickTimeThreshold = 300;

  useEffect(() => {
    // Initialize menu position (center of screen)
    const initialX = window.innerWidth / 2 - 100;
    const initialY = window.innerHeight / 2 - 100;
    setMenuPos({ x: initialX, y: initialY });

    const handleMouseDown = (e: MouseEvent) => {
      if (!toggleRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      e.stopPropagation();

      dragStartPosRef.current = { x: e.pageX, y: e.pageY };
      dragStartTimeRef.current = Date.now();
      isDraggingRef.current = false;

      if (menuRef.current) {
        menuRef.current.style.position = 'fixed';
        const rect = menuRef.current.getBoundingClientRect();
        initialElementPosRef.current = { x: rect.left, y: rect.top };
      }
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

  return (
    <div
      ref={menuRef}
      className="menu"
      style={{
        left: `${menuPos.x}px`,
        top: `${menuPos.y}px`,
      }}
    >
      <div
        className={`menu ${isActive ? 'active' : ''}`}
        style={{ position: 'relative', width: '200px', height: '200px' }}
      >
        <div
          ref={toggleRef}
          className="toggle"
          role="button"
          tabIndex={0}
          aria-label="Toggle menu"
        >
          <span className="rotate">+</span>
        </div>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li style={{ '--i': 0 } as React.CSSProperties} className="green round-button">
            <button
              onClick={() => handleMenuItemClick(onOpenMessages)}
              aria-label="Open messages"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <MessageIcon size={20} style={{ color: 'white' }} />
            </button>
          </li>

          <li style={{ '--i': 1 } as React.CSSProperties} className="blue round-button">
            <button 
              onClick={toggleBackground}
              aria-label="Toggle background" 
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none', 
                background: 'transparent', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
              title={currentBackground === 'moire' ? 'Switch to Water' : 'Switch to Moire'}
            >
              {currentBackground === 'moire' ? '🌊' : '🔮'}
            </button>
          </li>

          <li style={{ '--i': 2 } as React.CSSProperties} className="purple round-button">
            <button aria-label="Settings" style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>
              ⚙️
            </button>
          </li>

          <li style={{ '--i': 3 } as React.CSSProperties} className="orange round-button">
            <button aria-label="Favorites" style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>
              ⭐
            </button>
          </li>

          <li style={{ '--i': 4 } as React.CSSProperties} className="red round-button">
            <button aria-label="Help" style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>
              ❓
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RadialMenu;
