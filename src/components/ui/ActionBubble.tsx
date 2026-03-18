import React, { useRef } from 'react';
import { motion, zIndex } from '@/design-system';

interface ActionBubbleProps {
  position: { x: number; y: number };
  isDragging: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
}

const ActionBubble = React.forwardRef<HTMLButtonElement, ActionBubbleProps>(
  ({ position, isDragging, onClick, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`action-bubble${isDragging ? ' is-dragging' : ''}`}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-label="Open quick actions"
        style={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          zIndex: zIndex.overlay + 10,
          width: '58px',
          height: '58px',
          padding: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'pointer',
          touchAction: 'none',
          transition: isDragging ? 'none' : `transform ${motion.duration.button} ${motion.easing.spring}, box-shadow ${motion.duration.button} ${motion.easing.ease}`,
        }}
      >
        <span className="action-bubble__icon" aria-hidden="true" style={{ fontSize: '1.5rem' }}>
          ⚡
        </span>
        <span className="sr-only">Actions</span>
      </button>
    );
  }
);

ActionBubble.displayName = 'ActionBubble';

export default ActionBubble;
