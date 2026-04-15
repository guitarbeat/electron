import React from 'react';
import type { SharedMemory } from '@/shared/types';
import { getStickyNoteRotation } from './memoryUtils';
import { typography } from '@/theme/tokens';

interface PolaroidMemoryProps {
  memory: SharedMemory;
  onPin: () => void;
  onDelete?: () => void;
}

const PolaroidMemory: React.FC<PolaroidMemoryProps> = ({ memory, onPin, onDelete }) => {
  const rotation = getStickyNoteRotation(memory);
  const hoverRotation = rotation + (rotation > 0 ? 2 : -2);

  return (
    <div
      className="polaroid-card"
      style={{
        ['--polaroid-rotation' as string]: `${rotation}deg`,
        ['--polaroid-hover-rotation' as string]: `${hoverRotation}deg`,
        ['--polaroid-shadow' as string]:
          '0 8px 16px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '260px',
        background: '#fff',
        padding: '12px 12px 32px 12px',
        boxShadow: 'var(--polaroid-shadow)',
        transform: 'rotate(var(--polaroid-rotation))',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        cursor: 'pointer',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-3deg)',
          width: '80px',
          height: '30px',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(1px)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          zIndex: 2,
        }}
      />

      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          background: memory.imageUrl ? `url(${memory.imageUrl})` : '#e2e8f0',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!memory.imageUrl ? (
          <span style={{ fontSize: '2rem', opacity: 0.3 }}>🎞️</span>
        ) : null}

        {memory.isPinned ? (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '1.2rem',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
          >
            📌
          </div>
        ) : null}
      </div>

      <div style={{ padding: '4px' }}>
        <h4
          style={{
            ...typography.presets.bodyXs,
            fontWeight: 800,
            color: '#1a1a2e',
            marginBottom: '4px',
            fontFamily: '"Comic Neue", "Comic Sans MS", cursive, sans-serif',
          }}
        >
          {memory.movieTitle}
        </h4>
        <p
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.4,
            color: '#334155',
            fontFamily: '"Trebuchet MS", sans-serif',
            marginBottom: '8px',
            fontStyle: 'italic',
          }}
        >
          &quot;{memory.note}&quot;
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            - {memory.author}
          </span>
          <span
            style={{
              fontSize: '0.6rem',
              color: '#94a3b8',
            }}
          >
            {new Date(memory.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div
        className="polaroid-actions"
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          transition: 'opacity 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPin();
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          title={memory.isPinned ? 'Unpin' : 'Pin'}
        >
          {memory.isPinned ? '📍' : '📌'}
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            title="Delete"
          >
            🗑️
          </button>
        ) : null}
      </div>

      <style>{`
        .polaroid-actions {
          opacity: 0;
        }
        .polaroid-card:hover .polaroid-actions {
          opacity: 1;
        }
        .polaroid-card:hover {
          transform: rotate(var(--polaroid-hover-rotation)) scale(1.05);
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default PolaroidMemory;
