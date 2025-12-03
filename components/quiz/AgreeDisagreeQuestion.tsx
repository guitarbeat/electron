import React from 'react';
import { AgreeDisagreeQuestion as AgreeDisagreeQuestionType } from '../../quizTypes';
import { spacing, typography, colors, shadows } from '../../design-system/tokens';

interface AgreeDisagreeQuestionProps {
  question: AgreeDisagreeQuestionType;
  selectedValue: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree' | null;
  onSelect: (value: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree') => void;
}

const AgreeDisagreeQuestion: React.FC<AgreeDisagreeQuestionProps> = ({
  question,
  selectedValue,
  onSelect,
}) => {
  // Convert symbolic value to numeric for slider (default to 50/Neutral if null)
  const getNumericValue = (val: string | null) => {
    switch (val) {
      case 'stronglyDisagree': return 0;
      case 'disagree': return 25;
      case 'neutral': return 50;
      case 'agree': return 75;
      case 'stronglyAgree': return 100;
      default: return 50;
    }
  };

  // Convert numeric slider value to symbolic value
  const getSymbolicValue = (val: number) => {
    if (val <= 20) return 'stronglyDisagree';
    if (val <= 40) return 'disagree';
    if (val <= 60) return 'neutral';
    if (val <= 80) return 'agree';
    return 'stronglyAgree';
  };

  const [sliderValue, setSliderValue] = React.useState(getNumericValue(selectedValue));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
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

        <div style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}>
          {/* Custom Track */}
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
          
          {/* Filled Track */}
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

          {/* Range Input */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            style={{
              width: '100%',
              position: 'absolute',
              opacity: 0, // Hide default input
              cursor: 'pointer',
              height: '40px',
              zIndex: 10,
            }}
            aria-label="Agree/Disagree scale"
          />

          {/* Custom Thumb */}
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
              pointerEvents: 'none', // Let clicks pass to input
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

export default AgreeDisagreeQuestion;
