import React from 'react';
import { colors } from '../../design-system/tokens';

interface DragDismissZoneProps {
  visible: boolean;
  isHovering: boolean;
}

const DragDismissZone: React.FC<DragDismissZoneProps> = ({ visible, isHovering }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: `translateX(-50%) scale(${visible ? (isHovering ? 1.3 : 1) : 0.5})`,
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        zIndex: 9999,
        transition:
          'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, background 0.15s ease',
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: isHovering ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${isHovering ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isHovering ? '0 0 24px rgba(239, 68, 68, 0.4)' : '0 4px 16px rgba(0, 0, 0, 0.3)',
      }}
      aria-hidden
    >
      <span
        style={{
          fontSize: isHovering ? '1.5rem' : '1.2rem',
          color: isHovering ? '#fff' : colors.textSecondary,
          lineHeight: 1,
          transition: 'font-size 0.15s ease',
        }}
      >
        ✕
      </span>
    </div>
  );
};

export default DragDismissZone;
