import React, { useEffect } from 'react';
import { type CommandActionItem } from './CommandDeck';

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

function computeFanPositions(
  count: number,
  anchorX: number,
  anchorY: number,
  anchorSize: number,
): { x: number; y: number }[] {
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 400;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cx = anchorX + anchorSize / 2;
  const cy = anchorY + anchorSize / 2;

  const isBottom = cy > screenH * 0.55;
  const isRight = cx > screenW * 0.55;

  const radius = Math.min(screenW * 0.22, 130);
  const totalArc = count <= 3 ? 80 : count <= 5 ? 130 : 168;

  let baseAngle: number;
  if (isBottom && !isRight) baseAngle = -75;
  else if (isBottom && isRight) baseAngle = -105;
  else if (!isBottom && !isRight) baseAngle = 75;
  else baseAngle = 105;

  const halfArc = totalArc / 2;
  const startAngle = baseAngle - halfArc;
  const step = count > 1 ? totalArc / (count - 1) : 0;

  return Array.from({ length: count }, (_, i) => {
    const angle = startAngle + i * step;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    };
  });
}

interface ActionFanMenuProps {
  items: readonly CommandActionItem[];
  anchorX: number;
  anchorY: number;
  anchorSize: number;
  onItemSelect: (item: CommandActionItem) => void;
  onClose: () => void;
}

const ActionFanMenu: React.FC<ActionFanMenuProps> = ({
  items,
  anchorX,
  anchorY,
  anchorSize,
  onItemSelect,
  onClose,
}) => {
  const positions = computeFanPositions(items.length, anchorX, anchorY, anchorSize);
  const cx = anchorX + anchorSize / 2;
  const cy = anchorY + anchorSize / 2;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      <div
        className="action-fan-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {items.map((item, i) => {
        const pos = positions[i];
        const accent = ACCENT_PALETTE[i % ACCENT_PALETTE.length];
        const halo = HALO_PALETTE[i % HALO_PALETTE.length];

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
              position: 'fixed',
              left: `${cx + pos.x}px`,
              top: `${cy + pos.y}px`,
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
            <span className="action-fan-item__label">{item.label}</span>
          </button>
        );
      })}
    </>
  );
};

export default ActionFanMenu;
