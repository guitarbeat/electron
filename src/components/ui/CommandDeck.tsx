import React from 'react';
import { colors, radius, spacing, typography, motion, shadows } from '@/design-system';

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

  return (
    <div 
      className={isCompact ? 'command-deck command-deck--compact' : 'command-deck'}
      style={{
        display: 'grid',
        gridTemplateColumns: isCompact ? 'repeat(auto-fill, minmax(110px, 1fr))' : '1fr',
        gap: spacing.sm,
        width: '100%',
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="command-deck__item"
          onClick={() => onItemSelect(item)}
          style={{
            display: 'flex',
            flexDirection: isCompact ? 'column' : 'row',
            alignItems: 'center',
            gap: spacing.sm,
            padding: isCompact ? `${spacing.md} ${spacing.sm}` : `${spacing.sm} ${spacing.md}`,
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: radius.md,
            color: colors.textPrimary,
            cursor: 'pointer',
            textAlign: isCompact ? 'center' : 'left',
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
              fontSize: isCompact ? '1.5rem' : '1.25rem',
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
      ))}
    </div>
  );
};

export default CommandDeck;
