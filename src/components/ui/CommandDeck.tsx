import React, { useState } from 'react';
import { colors } from '@/theme/tokens';

export interface CommandActionItem {
  label: string;
  icon: string;
  description?: string;
  action: () => void;
}

interface CommandDeckProps {
  items: readonly CommandActionItem[];
  onItemSelect: (item: CommandActionItem) => void;
}

const ACTION_PALETTE = [
  colors.accent,
  colors.secondary,
  colors.tertiary,
  colors.warning,
  colors.success,
];

const CommandDeck: React.FC<CommandDeckProps> = ({ items, onItemSelect }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="command-deck command-deck--compact">
      {items.map((item, index) => {
        const accentColor = ACTION_PALETTE[index % ACTION_PALETTE.length];
        const isHovered = hoveredIndex === index;

        return (
          <button
            key={item.label}
            type="button"
            className="command-deck__row-item"
            onClick={() => onItemSelect(item)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            style={
              {
                '--item-index': index,
                '--row-accent': accentColor,
              } as React.CSSProperties
            }
          >
            <span
              className="command-deck__row-icon"
              aria-hidden="true"
              style={
                isHovered
                  ? {
                      background: `color-mix(in srgb, ${accentColor} 34%, transparent)`,
                      boxShadow: `0 0 14px color-mix(in srgb, ${accentColor} 44%, transparent)`,
                    }
                  : {
                      background: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
                    }
              }
            >
              {item.icon}
            </span>
            <span className="command-deck__row-text">
              <span className="command-deck__row-label">{item.label}</span>
              {item.description ? (
                <span className="command-deck__row-description">{item.description}</span>
              ) : null}
            </span>
            <span className="command-deck__row-chevron" aria-hidden="true">›</span>
          </button>
        );
      })}
    </div>
  );
};

export default CommandDeck;
