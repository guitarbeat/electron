import React, { useState } from 'react';
import { colors, radius, spacing, typography, motion, shadows } from '@/design-system';
import GelBubbleAvatar from '../common/GelBubbleAvatar';

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
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: isCompact ? spacing.md : spacing.sm,
        width: '100%',
        padding: isCompact ? `${spacing.md} 0` : 0,
      }}
    >
      {items.map((item, index) => {
        const accentColor = actionPalette[index % actionPalette.length];
        const haloColor = actionPalette[(index + 2) % actionPalette.length];

        return isCompact ? (
          <div
            key={item.label}
            className="command-deck__bubble-item"
            style={{ '--item-index': index } as React.CSSProperties}
          >
            <GelBubbleAvatar
              icon={item.icon}
              label={item.label}
              size="tiny"
              showName={false}
              isHovered={hoveredIndex === index}
              onClick={() => onItemSelect(item)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              accentColor={accentColor}
              haloColor={haloColor}
            />
            <span className="command-deck__bubble-label" aria-hidden="true">{item.label}</span>
          </div>
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
