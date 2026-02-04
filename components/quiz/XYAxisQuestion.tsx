/**
 * XYAxisQuestion Component
 *
 * Interactive 2D grid where users place a point to answer the question.
 * Position maps to character scores via quadrant weighting.
 */

import React, { useState, useRef, useCallback } from 'react';
import { XYAxisQuestion as XYAxisQuestionType } from './types';
import { spacing, colors, typography, radius, shadows } from '../../design-system/tokens';

interface XYAxisQuestionProps {
  question: XYAxisQuestionType;
  selectedPosition: { x: number; y: number } | null;
  onSelect: (position: { x: number; y: number }) => void;
}

const XYAxisQuestion: React.FC<XYAxisQuestionProps> = ({
  question,
  selectedPosition,
  onSelect,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null;

    const rect = gridRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
    const y = 1 - ((clientY - rect.top) / rect.height) * 2; // -1 to 1 (inverted for screen coords)

    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const pos = calculatePosition(e.clientX, e.clientY);
    if (pos) onSelect(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const pos = calculatePosition(e.clientX, e.clientY);
    if (pos) onSelect(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const pos = calculatePosition(touch.clientX, touch.clientY);
    if (pos) onSelect(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const pos = calculatePosition(touch.clientX, touch.clientY);
    if (pos) onSelect(pos);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 0.1;
    const current = selectedPosition || { x: 0, y: 0 };
    let newPos = { ...current };

    switch (e.key) {
      case 'ArrowLeft':
        newPos.x = Math.max(-1, current.x - step);
        break;
      case 'ArrowRight':
        newPos.x = Math.min(1, current.x + step);
        break;
      case 'ArrowUp':
        newPos.y = Math.min(1, current.y + step);
        break;
      case 'ArrowDown':
        newPos.y = Math.max(-1, current.y - step);
        break;
      default:
        return;
    }

    e.preventDefault();
    onSelect(newPos);
  };

  // Convert position (-1 to 1) to percentage (0 to 100)
  const markerLeft = selectedPosition ? ((selectedPosition.x + 1) / 2) * 100 : 50;
  const markerTop = selectedPosition ? ((1 - selectedPosition.y) / 2) * 100 : 50;

  return (
    <div>
      {/* Question text */}
      <h2
        style={{
          fontSize: typography.fontSize['2xl'],
          fontFamily: typography.fontFamily.heading.join(', '),
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing.xl,
          textShadow: shadows.textGlow,
        }}
      >
        {question.question}
      </h2>

      {/* Grid container */}
      <div
        style={{
          position: 'relative',
          maxWidth: '400px',
          margin: '0 auto',
        }}
      >
        {/* Top label */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: spacing.sm,
            fontSize: typography.fontSize.sm,
            color: colors.secondary,
            fontWeight: typography.fontWeight.bold,
          }}
        >
          {question.yAxis.topLabel}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          {/* Left label */}
          <div
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontSize: typography.fontSize.sm,
              color: colors.secondary,
              fontWeight: typography.fontWeight.bold,
              whiteSpace: 'nowrap',
            }}
          >
            {question.xAxis.leftLabel}
          </div>

          {/* The grid */}
          <div
            ref={gridRef}
            role="slider"
            aria-label="XY position selector"
            aria-valuetext={
              selectedPosition
                ? `X: ${selectedPosition.x.toFixed(1)}, Y: ${selectedPosition.y.toFixed(1)}`
                : 'No position selected'
            }
            tabIndex={0}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              aspectRatio: '1',
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              border: `2px solid ${colors.borderSecondary}`,
              position: 'relative',
              cursor: 'crosshair',
              touchAction: 'none',
              outline: 'none',
            }}
          >
            {/* Grid lines */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: `${colors.borderSecondary}60`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: `${colors.borderSecondary}60`,
              }}
            />

            {/* Quadrant hints (subtle) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                pointerEvents: 'none',
              }}
            >
              <div style={{ backgroundColor: 'rgba(135, 206, 250, 0.05)' }} />
              <div style={{ backgroundColor: 'rgba(255, 105, 180, 0.05)' }} />
              <div style={{ backgroundColor: 'rgba(74, 222, 128, 0.05)' }} />
              <div style={{ backgroundColor: 'rgba(147, 112, 219, 0.05)' }} />
            </div>

            {/* Marker */}
            {selectedPosition && (
              <div
                style={{
                  position: 'absolute',
                  left: `${markerLeft}%`,
                  top: `${markerTop}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: colors.accent,
                  border: '3px solid white',
                  boxShadow: `${shadows.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
                  transition: isDragging ? 'none' : 'all 0.15s ease-out',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Click hint when no selection */}
            {!selectedPosition && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textTertiary,
                  fontSize: typography.fontSize.sm,
                  pointerEvents: 'none',
                }}
              >
                Tap to place marker
              </div>
            )}
          </div>

          {/* Right label */}
          <div
            style={{
              writingMode: 'vertical-rl',
              fontSize: typography.fontSize.sm,
              color: colors.secondary,
              fontWeight: typography.fontWeight.bold,
              whiteSpace: 'nowrap',
            }}
          >
            {question.xAxis.rightLabel}
          </div>
        </div>

        {/* Bottom label */}
        <div
          style={{
            textAlign: 'center',
            marginTop: spacing.sm,
            fontSize: typography.fontSize.sm,
            color: colors.secondary,
            fontWeight: typography.fontWeight.bold,
          }}
        >
          {question.yAxis.bottomLabel}
        </div>
      </div>

      {/* Position indicator */}
      {selectedPosition && (
        <div
          style={{
            textAlign: 'center',
            marginTop: spacing.lg,
            fontSize: typography.fontSize.xs,
            color: colors.textTertiary,
          }}
          role="status"
          aria-live="polite"
        >
          Position: ({selectedPosition.x.toFixed(2)}, {selectedPosition.y.toFixed(2)})
        </div>
      )}
    </div>
  );
};

export default XYAxisQuestion;
