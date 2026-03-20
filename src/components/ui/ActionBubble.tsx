import React, { useState } from 'react';
import { zIndex, motion } from '@/design-system';
import GelBubbleAvatar from '../common/GelBubbleAvatar';
import { QuickActionsIcon } from '../common/icons';
import { User } from '@/types';

interface ActionBubbleProps {
  currentUser?: User | null;
  position: { x: number; y: number };
  isDragging: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
}

const ActionBubble = React.forwardRef<HTMLButtonElement, ActionBubbleProps>(
  (
    {
      currentUser,
      position,
      isDragging,
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className={`action-bubble-container${isDragging ? ' is-dragging' : ''}`}
        style={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          zIndex: zIndex.overlay + 10,
          touchAction: 'none',
          pointerEvents: 'none',
          transition: isDragging
            ? 'none'
            : `top 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), transform ${motion.duration.button} ${motion.easing.spring}`,
          cursor: isDragging ? 'grabbing' : 'pointer',
        }}
      >
        <GelBubbleAvatar
          ref={ref}
          user={currentUser || undefined}
          icon={!currentUser ? <QuickActionsIcon /> : undefined}
          size="action"
          isHovered={isHovered || isDragging}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          showName={false}
          accentColor="var(--color-accent)"
          haloColor="var(--color-quaternary)"
          aria-label="Open quick actions"
          style={{
            transition: isDragging ? 'none' : `all ${motion.duration.button} ${motion.easing.spring}`,
            pointerEvents: 'auto',
          }}
        />
        <span className="sr-only">Actions</span>
      </div>
    );
  }
);

ActionBubble.displayName = 'ActionBubble';

export default ActionBubble;
