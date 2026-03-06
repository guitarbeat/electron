import React, { useState } from 'react';
import { useBubbleDismiss, BubbleId } from '@/context/BubbleDismissContext';
import { colors, radius, spacing, shadows } from '@/design-system/tokens';

const RestoreBubblesButton: React.FC = () => {
  const { hiddenBubbles, restore, restoreAll, bubbleLabels } = useBubbleDismiss();
  const [isOpen, setIsOpen] = useState(false);

  if (hiddenBubbles.size === 0) return null;

  const hiddenIds = [...hiddenBubbles] as BubbleId[];

  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 999 }}>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            left: 0,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: shadows.card,
            padding: spacing.xs,
            minWidth: 160,
            animation: 'slide-up-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {hiddenIds.map((id) => {
            const info = bubbleLabels[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  restore(id);
                  if (hiddenIds.length <= 1) setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  borderRadius: 8,
                  fontSize: 13,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>{info.emoji}</span>
                <span>{info.label}</span>
              </button>
            );
          })}
          {hiddenIds.length > 1 && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => {
                  restoreAll();
                  setIsOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  borderRadius: 8,
                  fontSize: 12,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Restore all
              </button>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Restore hidden bubbles"
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.full,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          color: colors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          boxShadow: shadows.card,
          padding: 0,
        }}
      >
        {isOpen ? '×' : `+${hiddenBubbles.size}`}
      </button>
    </div>
  );
};

export default RestoreBubblesButton;
