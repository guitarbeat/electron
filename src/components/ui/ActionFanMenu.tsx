import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { colors, motion } from '@/design-system';
import GelBubbleAvatar from '../common/GelBubbleAvatar';
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

const ActionFanMenu: React.FC<ActionFanMenuProps> = ({
  items,
  anchorX,
  anchorY,
  anchorSize,
  onItemSelect,
  onClose,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const handleItemClick = useCallback((item: CommandActionItem) => {
    onItemSelect(item);
    onClose();
  }, [onItemSelect, onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Get viewport dimensions for positioning
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Compute positions using the enhanced layout algorithm
  const positions = computeActionFanPositions({
    count: items.length,
    anchorX,
    anchorY,
    anchorSize,
    viewportWidth,
    viewportHeight,
  });

  const layoutType = useMemo(() => {
    if (items.length >= 6) {
      const centerX = anchorX + anchorSize / 2;
      const centerY = anchorY + anchorSize / 2;
      
      const avgDistance = positions.reduce((sum, pos) => {
        return sum + Math.hypot(pos.x - centerX, pos.y - centerY);
      }, 0) / positions.length;
      
      if (avgDistance < 100) {
        return 'cluster';
      }
      if (Math.abs(positions[0]?.x - centerX) < 10 && Math.abs(positions[0]?.y - centerY) < 10) {
        return 'flower';
      }
      if (items.length >= 5) {
        return 'spiral';
      }
      return 'wave';
    }
    return 'arc';
  }, [items.length, positions, anchorX, anchorY, anchorSize]);

  // Action palette for colors
  const actionPalette = [
    colors.accent,
    colors.secondary,
    colors.tertiary,
    colors.warning,
    colors.success,
  ];

  // Get animation based on layout type
  const getAnimationDelay = (index: number) => {
    switch (layoutType) {
      case 'spiral':
        return index * 30; // Fast sequential for spiral
      case 'flower':
        return index === 0 ? 0 : index * 40; // Center first, then petals
      case 'wave':
        return Math.abs(index - Math.floor(items.length / 2)) * 30; // Outside-in for wave
      case 'cluster':
        return (index % 2) * 20; // Alternating for grid
      default:
        return index * 50; // Staggered for arc
    }
  };

  return (
    <div
      className="action-fan-menu"
      style={{
        ['--fan-origin-x' as string]: `${anchorX + anchorSize / 2}px`,
        ['--fan-origin-y' as string]: `${anchorY + anchorSize / 2}px`,
      }}
    >
      <div
        className="action-fan-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="action-fan-origin" aria-hidden="true">
        <div className="action-fan-origin__core" />
        <div className="action-fan-origin__ring action-fan-origin__ring--inner" />
        <div className="action-fan-origin__ring action-fan-origin__ring--outer" />
      </div>

      {items.map((item, index) => {
        const position = positions[index];
        const accentColor = actionPalette[index % actionPalette.length];
        const haloColor = actionPalette[(index + 2) % actionPalette.length];

        return (
          <div
            key={item.label}
            className={`action-fan-item action-fan-item--${layoutType}${hoveredIndex === index ? ' is-hovered' : ''}`}
            style={{
              left: position.x,
              top: position.y,
              ['--fan-i' as string]: index,
              ['--fan-delay' as string]: `${getAnimationDelay(index)}ms`,
              ['--fan-accent' as string]: accentColor,
              ['--fan-halo' as string]: haloColor,
            }}
          >
            <span className="action-fan-item__trail" aria-hidden="true" />
            <GelBubbleAvatar
              className="action-fan-avatar"
              icon={item.icon}
              size="action"
              showName={false}
              isHovered={hoveredIndex === index}
              onClick={() => handleItemClick(item)}
              accentColor={accentColor}
              haloColor={haloColor}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              style={{
                cursor: 'pointer',
                transition: `transform ${motion.duration.button} ${motion.easing.ease}, filter ${motion.duration.button} ${motion.easing.ease}`,
                filter: hoveredIndex === index ? 'brightness(1.12) saturate(1.08)' : 'brightness(1)',
              }}
            />
            <span className="action-fan-item__label" aria-hidden="true">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ActionFanMenu;
