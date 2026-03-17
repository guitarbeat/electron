import React from 'react';
import { QuizCharacter, CHARACTERS } from '@/types';
import Card from '@/ui/Card';
import Textarea from '@/ui/Textarea';
import { spacing, colors, typography } from '@/design-system';

// Descriptions Tab Component
interface DescriptionsTabProps {
  characterDescriptions: Record<QuizCharacter, string>;
  neitherDescription: string;
  onUpdateDescriptions: (descriptions: Record<QuizCharacter, string>) => void;
  onUpdateNeither: (description: string) => void;
}

const DescriptionsTab: React.FC<DescriptionsTabProps> = ({
  characterDescriptions,
  neitherDescription,
  onUpdateDescriptions,
  onUpdateNeither,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {CHARACTERS.map((char) => (
        <Card key={char} variant="default">
          <div style={{ padding: spacing.lg }}>
            <h3
              style={{
                fontSize: typography.fontSize.lg,
                marginBottom: spacing.md,
                fontFamily: typography.fontFamily.heading.join(', '),
                color: colors.accent,
              }}
            >
              {char}
            </h3>
            <Textarea
              value={characterDescriptions[char]}
              onChange={(e) =>
                onUpdateDescriptions({ ...characterDescriptions, [char]: e.target.value })
              }
              rows={3}
              style={{ textAlign: 'left' }}
            />
          </div>
        </Card>
      ))}

      <Card variant="default">
        <div style={{ padding: spacing.lg }}>
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              marginBottom: spacing.md,
              fontFamily: typography.fontFamily.heading.join(', '),
              color: colors.textSecondary,
            }}
          >
            "Neither" Result
          </h3>
          <Textarea
            value={neitherDescription}
            onChange={(e) => onUpdateNeither(e.target.value)}
            rows={3}
            style={{ textAlign: 'left' }}
          />
        </div>
      </Card>
    </div>
  );
};

export default DescriptionsTab;
