import React from 'react';
import type { SharedMemory } from '@/shared/types';
import { getStickyNoteRotation } from './lib/memoryUtils';
import { typography } from '@/theme/tokens';
import { formatMemoryTimestamp } from '@/utils';

interface PolaroidMemoryProps {
  memory: SharedMemory;
  onPin: () => void;
  onDelete?: () => void;
}

const PolaroidMemory: React.FC<PolaroidMemoryProps> = ({ memory, onPin, onDelete }) => {
  const rotation = getStickyNoteRotation(memory);
  const hoverRotation = rotation + (rotation > 0 ? 1.4 : -1.4);

  return (
    <div
      className="polaroid-card"
      style={{
        ['--polaroid-rotation' as string]: `${rotation}deg`,
        ['--polaroid-hover-rotation' as string]: `${hoverRotation}deg`,
        ['--polaroid-shadow' as string]:
          '0 18px 32px rgba(10, 7, 5, 0.24), 0 2px 6px rgba(0,0,0,0.12)',
        width: '100%',
        maxWidth: '248px',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,242,232,0.98) 100%)',
        padding: '12px 12px 18px 12px',
        boxShadow: 'var(--polaroid-shadow)',
        transform: 'rotate(var(--polaroid-rotation))',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        cursor: 'pointer',
        border: '1px solid rgba(74, 57, 36, 0.12)',
        transformOrigin: 'center 85%',
        transition: 'transform 220ms ease, box-shadow 220ms ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-14px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-3deg)',
          width: '72px',
          height: '26px',
          background: 'rgba(220, 204, 177, 0.42)',
          border: '1px solid rgba(126, 103, 70, 0.08)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
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
          border: '1px solid rgba(66, 49, 32, 0.14)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!memory.imageUrl ? (
          <span style={{ fontSize: '1.7rem', opacity: 0.24 }}>🎞️</span>
        ) : null}

        {memory.isPinned ? (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              minHeight: '24px',
              padding: '0 8px',
              borderRadius: '999px',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(21, 17, 13, 0.72)',
              color: '#fff3df',
            }}
          >
            Pinned
          </div>
        ) : null}
      </div>

      <div style={{ padding: '2px 4px 0' }}>
        <h4
          style={{
            margin: 0,
            color: '#25180f',
            fontSize: '0.96rem',
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: '0.03em',
            fontFamily: '"Cormorant Garamond", serif',
          }}
        >
          {memory.movieTitle}
        </h4>
        <p
          style={{
            margin: '0.45rem 0 0',
            fontSize: '0.8rem',
            lineHeight: 1.48,
            color: '#4d3b2a',
            fontFamily: typography.fontFamilyValue.body,
          }}
        >
          {memory.note.length > 110 ? `${memory.note.slice(0, 110)}…` : memory.note}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.7rem',
            paddingTop: '0.55rem',
            borderTop: '1px solid rgba(72, 55, 35, 0.1)',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              color: '#705742',
              fontWeight: 600,
            }}
          >
            {memory.author}
          </span>
          <span
            style={{
              fontSize: '0.6rem',
              color: '#927760',
            }}
          >
            {formatMemoryTimestamp(memory.createdAt)}
          </span>
        </div>
      </div>

      <div
        className="polaroid-actions"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          transition: 'opacity 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPin();
          }}
          style={{
            minWidth: '34px',
            height: '28px',
            borderRadius: '999px',
            border: '1px solid rgba(63, 48, 31, 0.12)',
            background: 'rgba(255,255,255,0.88)',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
          aria-label={memory.isPinned ? 'Unpin' : 'Pin'}
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
            style={{
              minWidth: '34px',
              height: '28px',
              borderRadius: '999px',
              border: '1px solid rgba(63, 48, 31, 0.12)',
              background: 'rgba(255,255,255,0.88)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
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
          transform: rotate(var(--polaroid-hover-rotation)) translateY(-3px) scale(1.02);
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default PolaroidMemory;
