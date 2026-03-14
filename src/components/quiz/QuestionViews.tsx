import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AgreeDisagreeQuestion as AgreeDisagreeQuestionType,
  ImageChoiceQuestion as ImageChoiceQuestionType,
  MultipleChoiceQuestion as MultipleChoiceQuestionType,
  XYAxisQuestion as XYAxisQuestionType,
} from './types';
import Button from '@/ui/Button';
import { spacing, typography, colors, shadows, radius } from '@/design-system/tokens';

interface MultipleChoiceQuestionViewProps {
  question: MultipleChoiceQuestionType;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export const MultipleChoiceQuestionView: React.FC<MultipleChoiceQuestionViewProps> = ({
  question,
  selectedIndex,
  onSelect,
}) => {
  return (
    <div className="animate-fade-in">
      <h3
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.semibold,
          color: colors.textPrimary,
          marginBottom: spacing.xl,
          textAlign: 'center',
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {question.question}
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant={selectedIndex === index ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => onSelect(index)}
            style={{
              width: '100%',
              fontSize: typography.fontSize.lg,
              textAlign: 'left',
              justifyContent: 'flex-start',
              padding: spacing.lg,
              position: 'relative',
              overflow: 'hidden',
            }}
            aria-pressed={selectedIndex === index}
          >
            {option.text}
            {selectedIndex === index && (
              <span
                style={{
                  position: 'absolute',
                  right: spacing.lg,
                  fontSize: typography.fontSize.xl,
                }}
              >
                ✓
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

interface AgreeDisagreeQuestionViewProps {
  question: AgreeDisagreeQuestionType;
  selectedValue: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree' | null;
  onSelect: (
    value: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree'
  ) => void;
}

export const AgreeDisagreeQuestionView: React.FC<AgreeDisagreeQuestionViewProps> = ({
  question,
  selectedValue,
  onSelect,
}) => {
  const getNumericValue = (val: string | null) => {
    switch (val) {
      case 'stronglyDisagree':
        return 0;
      case 'disagree':
        return 25;
      case 'neutral':
        return 50;
      case 'agree':
        return 75;
      case 'stronglyAgree':
        return 100;
      default:
        return 50;
    }
  };

  const getSymbolicValue = (val: number) => {
    if (val <= 20) return 'stronglyDisagree';
    if (val <= 40) return 'disagree';
    if (val <= 60) return 'neutral';
    if (val <= 80) return 'agree';
    return 'stronglyAgree';
  };

  const [sliderValue, setSliderValue] = useState(getNumericValue(selectedValue));

  useEffect(() => {
    setSliderValue(getNumericValue(selectedValue));
  }, [selectedValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderValue(val);
    onSelect(getSymbolicValue(val));
  };

  return (
    <div className="animate-fade-in">
      <h3
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.semibold,
          color: colors.textPrimary,
          marginBottom: spacing.xl,
          textAlign: 'center',
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {question.question}
      </h3>

      <div
        style={{
          padding: `0 ${spacing.lg}`,
          marginBottom: spacing.xl,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>

        <div
          style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '8px',
              backgroundColor: colors.surface,
              borderRadius: '4px',
              border: `1px solid ${colors.borderSecondary}`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 0,
              width: `${sliderValue}%`,
              height: '8px',
              backgroundColor: colors.accent,
              borderRadius: '4px',
              transition: 'width 0.1s ease-out',
            }}
          />

          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            style={{
              width: '100%',
              position: 'absolute',
              opacity: 0,
              cursor: 'pointer',
              height: '40px',
              zIndex: 10,
            }}
            aria-label="Agree/Disagree scale"
          />

          <div
            style={{
              position: 'absolute',
              left: `${sliderValue}%`,
              transform: 'translateX(-50%)',
              width: '24px',
              height: '24px',
              backgroundColor: colors.accent,
              borderRadius: '50%',
              border: `2px solid #fff`,
              boxShadow: shadows.glow,
              pointerEvents: 'none',
              transition: 'left 0.1s ease-out',
            }}
          />
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: spacing.md,
            color: colors.textPrimary,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            minHeight: '2rem',
          }}
        >
          {sliderValue <= 20 && 'Strongly Disagree'}
          {sliderValue > 20 && sliderValue <= 40 && 'Disagree'}
          {sliderValue > 40 && sliderValue <= 60 && 'Neutral'}
          {sliderValue > 60 && sliderValue <= 80 && 'Agree'}
          {sliderValue > 80 && 'Strongly Agree'}
        </div>
      </div>
    </div>
  );
};

interface ImageChoiceQuestionViewProps {
  question: ImageChoiceQuestionType;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export const ImageChoiceQuestionView: React.FC<ImageChoiceQuestionViewProps> = ({
  question,
  selectedIndex,
  onSelect,
}) => {
  return (
    <div className="animate-fade-in">
      <h3
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.semibold,
          color: colors.textPrimary,
          marginBottom: spacing.xl,
          textAlign: 'center',
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {question.question}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            question.options.length === 2
              ? 'repeat(2, 1fr)'
              : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.lg,
        }}
      >
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            style={{
              position: 'relative',
              padding: 0,
              backgroundColor: 'transparent',
              border: `4px solid ${selectedIndex === index ? colors.accent : colors.borderSecondary}`,
              borderRadius: '12px',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              boxShadow: selectedIndex === index ? shadows.glow : shadows.card,
              aspectRatio: '3/2',
            }}
            onMouseEnter={(e) => {
              if (selectedIndex !== index) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = colors.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedIndex !== index) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = colors.borderSecondary;
              }
            }}
            aria-pressed={selectedIndex === index}
            aria-label={option.alt}
          >
            <img
              src={option.imageUrl}
              alt={option.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {selectedIndex === index && (
              <div
                style={{
                  position: 'absolute',
                  top: spacing.sm,
                  right: spacing.sm,
                  backgroundColor: colors.accent,
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize.xl,
                  boxShadow: shadows.glow,
                }}
                className="bounce-in"
              >
                ✓
              </div>
            )}
            {selectedIndex === index && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255, 105, 180, 0.2)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

interface XYAxisQuestionViewProps {
  question: XYAxisQuestionType;
  selectedPosition: { x: number; y: number } | null;
  onSelect: (position: { x: number; y: number }) => void;
}

export const XYAxisQuestionView: React.FC<XYAxisQuestionViewProps> = ({
  question,
  selectedPosition,
  onSelect,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null;

    const rect = gridRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((clientY - rect.top) / rect.height) * 2;

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

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const [touch] = Array.from(e.touches);
    if (!touch) return;
    const pos = calculatePosition(touch.clientX, touch.clientY);
    if (pos) onSelect(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const [touch] = Array.from(e.touches);
    if (!touch) return;
    const pos = calculatePosition(touch.clientX, touch.clientY);
    if (pos) onSelect(pos);
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 0.1;
    const current = selectedPosition || { x: 0, y: 0 };
    const newPos = { ...current };

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

  const markerLeft = selectedPosition ? ((selectedPosition.x + 1) / 2) * 100 : 50;
  const markerTop = selectedPosition ? ((1 - selectedPosition.y) / 2) * 100 : 50;

  return (
    <div>
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
      <div
        style={{
          position: 'relative',
          maxWidth: '400px',
          margin: '0 auto',
        }}
      >
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
