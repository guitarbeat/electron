import React, { useEffect, useCallback, useState } from 'react';
import { colors, motion, radius, spacing, typography } from '@/design-system';
import GelBubbleAvatar from '../common/GelBubbleAvatar';
import { computeActionFanPositions, type ActionFanLayoutOptions, type ActionFanPosition } from './actionFanLayout';
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
  const [layoutType, setLayoutType] = useState<string>('arc');
  
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

  // Detect layout type based on positions
  useEffect(() => {
    if (items.length >= 6) {
      const centerX = anchorX + anchorSize / 2;
      const centerY = anchorY + anchorSize / 2;
      
      // Simple heuristic to detect layout type
      const avgDistance = positions.reduce((sum, pos) => {
        return sum + Math.hypot(pos.x - centerX, pos.y - centerY);
      }, 0) / positions.length;
      
      if (avgDistance < 100) {
        setLayoutType('cluster');
      } else if (Math.abs(positions[0]?.x - centerX) < 10 && Math.abs(positions[0]?.y - centerY) < 10) {
        setLayoutType('flower');
      } else if (items.length >= 5) {
        setLayoutType('spiral');
      } else {
        setLayoutType('wave');
      }
    } else {
      setLayoutType('arc');
    }
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
    <>
      {/* Enhanced backdrop with gradient */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at ${anchorX + anchorSize/2}px ${anchorY + anchorSize/2}px, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6))`,
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Action items with enhanced animations */}
      {items.map((item, index) => {
        const position = positions[index];
        const accentColor = actionPalette[index % actionPalette.length];
        const haloColor = actionPalette[(index + 2) % actionPalette.length];

        return (
          <div
            key={item.label}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 1001,
              animation: `${layoutType}ItemAppear ${motion.duration.normal} ${motion.easing.spring} forwards`,
              animationDelay: `${getAnimationDelay(index)}ms`,
            }}
          >
            <GelBubbleAvatar
              icon={item.icon}
              label={item.label}
              size="action"
              showName={true}
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
                transition: `all ${motion.duration.button} ${motion.easing.ease}`,
                filter: hoveredIndex === index ? 'brightness(1.2)' : 'brightness(1)',
              }}
            />
          </div>
        );
      })}

      {/* Enhanced CSS animations for different layout types */}
      <style>{`
        @keyframes arcItemAppear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3) rotate(-15deg);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
        }

        @keyframes spiralItemAppear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.1) rotate(720deg);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
        }

        @keyframes flowerItemAppear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0) rotate(180deg);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
        }

        @keyframes waveItemAppear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) translateY(0);
          }
        }

        @keyframes clusterItemAppear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default ActionFanMenu;
