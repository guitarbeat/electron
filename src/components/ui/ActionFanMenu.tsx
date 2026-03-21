import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { colors } from '@/design-system';
import { computeActionFanPositions } from './actionFanLayout';
import type { CommandActionItem } from './CommandDeck';

interface ActionFanMenuProps {
  items: readonly CommandActionItem[];
  anchorX: number;
  anchorY: number;
  anchorSize: number;
  onItemSelect: (item: CommandActionItem) => void;
  onClose: () => void;
}

const actionPalette = [
  colors.accent,
  colors.secondary,
  colors.tertiary,
  colors.warning,
  colors.success,
] as const;

const getLabelOffsets = (
  position: { x: number; y: number },
  anchorCenterX: number,
  anchorCenterY: number
) => {
  const deltaX = position.x - anchorCenterX;
  const deltaY = position.y - anchorCenterY;
  const distance = Math.hypot(deltaX, deltaY) || 1;
  const unitX = deltaX / distance;
  const unitY = deltaY / distance;
  const baseDistance = Math.min(104, 54 + distance * 0.2);
  const horizontalBoost = Math.abs(unitX) > 0.72 ? 8 : 0;
  const verticalBoost = Math.abs(unitY) > 0.7 ? 14 : 0;

  return {
    ['--fan-label-x' as string]: `${Math.round(unitX * (baseDistance + horizontalBoost))}px`,
    ['--fan-label-y' as string]: `${Math.round(unitY * (baseDistance + verticalBoost))}px`,
  };
};

const ActionFanMenu: React.FC<ActionFanMenuProps> = ({
  items,
  anchorX,
  anchorY,
  anchorSize,
  onItemSelect,
  onClose,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const anchorCenterX = anchorX + anchorSize / 2;
  const anchorCenterY = anchorY + anchorSize / 2;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const positions = useMemo(
    () =>
      computeActionFanPositions({
        count: items.length,
        anchorX,
        anchorY,
        anchorSize,
        viewportWidth,
        viewportHeight,
      }),
    [items.length, anchorX, anchorY, anchorSize, viewportWidth, viewportHeight]
  );

  const handleItemClick = useCallback(
    (item: CommandActionItem) => {
      onItemSelect(item);
      onClose();
    },
    [onItemSelect, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="action-fan-menu" role="presentation">
      <div
        className="action-fan-backdrop"
        onClick={onClose}
        aria-hidden="true"
        style={
          {
            ['--action-fan-origin-x' as string]: `${anchorCenterX}px`,
            ['--action-fan-origin-y' as string]: `${anchorCenterY}px`,
          } as React.CSSProperties
        }
      />

      {items.map((item, index) => {
        const position = positions[index];
        const accentColor = actionPalette[index % actionPalette.length];
        const haloColor = actionPalette[(index + 2) % actionPalette.length];
        const labelOffsets = getLabelOffsets(position, anchorCenterX, anchorCenterY);

        return (
          <button
            key={item.label}
            type="button"
            className="action-fan-item"
            aria-label={item.label}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex((current) => (current === index ? null : current))}
            style={
              {
                left: `${position.x}px`,
                top: `${position.y}px`,
                ['--fan-i' as string]: index,
                ['--fan-accent' as string]: accentColor,
                ['--fan-halo' as string]: haloColor,
                ['--fan-hover-scale' as string]: hoveredIndex === index ? 1.12 : 1,
                ...labelOffsets,
              } as React.CSSProperties
            }
          >
            <span className="action-fan-item__bubble" aria-hidden="true">
              <span className="action-fan-item__chrome-ring" />
              <span className="action-fan-item__shine" />
              <span className="action-fan-item__core" />
              <span className="action-fan-item__icon">{item.icon}</span>
            </span>
            <span className="action-fan-item__label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ActionFanMenu;
