import React, { useState } from 'react';
import { colors, radius, spacing, typography, motion, shadows } from '@/theme/tokens';

export interface CommandActionItem {
  label: string;
  icon: string;
  action: () => void;
}

interface CommandDeckProps {
  items: readonly CommandActionItem[];
  variant?: 'default' | 'compact';
  onItemSelect: (item: CommandActionItem) => void;
}

const CommandDeck: React.FC<CommandDeckProps> = ({
  items,
  variant = 'default',
  onItemSelect,
}) => {
  const isCompact = variant === 'compact';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const actionPalette = [
    colors.accent,
    colors.secondary,
    colors.tertiary,
    colors.warning,
    colors.success,
  ];

  return (
    <div
      className={isCompact ? 'command-deck command-deck--compact' : 'command-deck'}
      style={
        isCompact
          ? { display: 'flex', flexDirection: 'column', width: '100%' }
          : {
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: spacing.sm,
              width: '100%',
            }
      }
    >
      {items.map((item, index) => {
        const accentColor = actionPalette[index % actionPalette.length];

        return isCompact ? (
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
                hoveredIndex === index
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
            <span className="command-deck__row-label">{item.label}</span>
            <span className="command-deck__row-chevron" aria-hidden="true">›</span>
          </button>
        ) : (
          <button
            key={item.label}
            type="button"
            className="command-deck__item"
            onClick={() => onItemSelect(item)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.sm} ${spacing.md}`,
              background: `linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 44%), ${accentColor}14`,
              border: `1px solid ${accentColor}52`,
              borderRadius: radius.md,
              color: colors.textPrimary,
              cursor: 'pointer',
              textAlign: 'left',
              transition: `all ${motion.duration.button} ${motion.easing.ease}`,
              boxShadow: `${shadows.button}, 0 0 0 1px ${accentColor}20`,
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, transparent 42%), ${accentColor}30`;
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `${shadows.buttonHover}, 0 0 18px ${accentColor}45`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 44%), ${accentColor}14`;
              e.currentTarget.style.borderColor = `${accentColor}52`;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `${shadows.button}, 0 0 0 1px ${accentColor}20`;
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.background = `linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 46%), ${accentColor}3d`;
              e.currentTarget.style.transform = 'translateY(1px)';
              e.currentTarget.style.boxShadow = `${shadows.buttonActive}, 0 0 12px ${accentColor}40`;
            }}
          >
            <span
              className="command-deck__icon"
              aria-hidden="true"
              style={{
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </span>
            <span
              className="command-deck__label"
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamilyValue.heading,
                letterSpacing: typography.letterSpacing.wide,
                textTransform: 'uppercase',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CommandDeck;
