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
      {items.map((item, index) =>
        isCompact ? (
          <div key={item.label} className="command-deck__bubble-item">
            <GelBubbleAvatar
              icon={item.icon}
              label={item.label}
              size="tiny"
              isHovered={hoveredIndex === index}
              onClick={() => onItemSelect(item)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              accentColor={index % 2 === 0 ? 'var(--color-accent)' : 'var(--color-secondary)'}
              haloColor={index % 2 === 0 ? 'var(--color-tertiary)' : 'var(--color-accent)'}
            />
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
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: radius.md,
              color: colors.textPrimary,
              cursor: 'pointer',
              textAlign: 'left',
              transition: `all ${motion.duration.button} ${motion.easing.ease}`,
              boxShadow: shadows.button,
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = shadows.buttonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = colors.borderSubtle;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = shadows.button;
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(1px)';
              e.currentTarget.style.boxShadow = shadows.buttonActive;
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
        )
      )}
    </div>
  );
};

export default CommandDeck;
