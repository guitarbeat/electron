import React, { useEffect } from 'react';
import { type CommandActionItem } from './CommandDeck';
import { computeActionFanPositions } from './actionFanLayout';

const ACCENT_PALETTE = [
  '#ff7da8',
  '#ffd9a0',
  '#c4b5fd',
  '#fbbf24',
  '#86efac',
  '#93c5fd',
  '#f9a8d4',
];

const HALO_PALETTE = [
  '#ffd9a0',
  '#ff7da8',
  '#86efac',
  '#c4b5fd',
  '#fbbf24',
  '#f9a8d4',
  '#93c5fd',
];

interface ActionFanMenuProps {
  items: readonly CommandActionItem[];
  anchorX: number;
  anchorY: number;
  anchorSize: number;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  onItemSelect: (item: CommandActionItem) => void;
  onClose: () => void;
}

const BUBBLE_RADIUS = 36; // half of 72px desktop bubble
const LABEL_OFFSET = BUBBLE_RADIUS + 22; // px from bubble center → label center

const ActionFanMenu: React.FC<ActionFanMenuProps> = ({
  items,
  anchorX,
  anchorY,
  anchorSize,
  menuRef,
  onItemSelect,
  onClose,
}) => {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const positions = computeActionFanPositions({
    count: items.length,
    anchorX,
    anchorY,
    anchorSize,
    viewportWidth,
    viewportHeight,
  });

  // Centre of the trigger bubble — labels radiate outward from here
  const fanCX = anchorX + anchorSize / 2;
  const fanCY = anchorY + anchorSize / 2;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="action-fan-menu" ref={menuRef}>
      <div
        className="action-fan-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {items.map((item, i) => {
        const pos = positions[i];
        const accent = ACCENT_PALETTE[i % ACCENT_PALETTE.length];
        const halo = HALO_PALETTE[i % HALO_PALETTE.length];

        // Unit vector pointing FROM the fan centre TO this item
        const dx = pos.x - fanCX;
        const dy = pos.y - fanCY;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;

        // Push label outward along that vector
        const lx = Math.round(ux * LABEL_OFFSET);
        const ly = Math.round(uy * LABEL_OFFSET);

        return (
          <button
            key={item.label}
            type="button"
            className="action-fan-item"
            onClick={() => {
              onItemSelect(item);
              onClose();
            }}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              '--fan-i': i,
              '--fan-accent': accent,
              '--fan-halo': halo,
            } as React.CSSProperties}
            aria-label={item.label}
          >
            <div className="action-fan-item__bubble">
              <div className="action-fan-item__chrome-ring" aria-hidden="true" />
              <div className="action-fan-item__shine" aria-hidden="true" />
              <span className="action-fan-item__icon" aria-hidden="true">{item.icon}</span>
            </div>
            <span
              className="action-fan-item__label"
              style={{
                transform: `translate(calc(-50% + ${lx}px), calc(-50% + ${ly}px))`,
              }}
              aria-hidden="true"
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ActionFanMenu;
