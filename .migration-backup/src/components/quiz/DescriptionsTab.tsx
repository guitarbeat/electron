import React from 'react';
import { QuizCharacter, CHARACTERS } from '@/shared/types';
import Card from '@/ui/Card';
import { Textarea } from '@/ui/FormFields';

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
  const completedProfiles =
    CHARACTERS.filter((character) => characterDescriptions[character].trim().length > 0).length +
    Number(neitherDescription.trim().length > 0);
  const totalProfiles = CHARACTERS.length + 1;
  const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="quiz-editor__descriptions">
      <div className="quiz-editor__description-overview">
        <p className="quiz-editor__section-eyebrow">Result Writing</p>
        <h2 className="quiz-editor__section-title">Give every ending a distinct voice.</h2>
        <p className="quiz-editor__description-overview-copy">
          Each profile should feel specific enough that the player instantly recognizes why they
          landed there.
        </p>
        <p className="quiz-editor__stat-detail">
          {completedProfiles} of {totalProfiles} result descriptions currently have copy.
        </p>
      </div>

      <div className="quiz-editor__description-grid">
        {CHARACTERS.map((char) => (
          <Card key={char} variant="default" className="quiz-editor__description-card">
            <div className="quiz-editor__description-header">
              <div>
                <p className="quiz-editor__section-eyebrow">Character Result</p>
                <h3 className="quiz-editor__description-name">{char}</h3>
              </div>
              <span className="quiz-editor__description-count">
                {countWords(characterDescriptions[char])} words
              </span>
            </div>

            <Textarea
              value={characterDescriptions[char]}
              onChange={(e) =>
                onUpdateDescriptions({ ...characterDescriptions, [char]: e.target.value })
              }
              rows={6}
              style={{ textAlign: 'left' }}
            />
          </Card>
        ))}

        <Card
          variant="default"
          className="quiz-editor__description-card quiz-editor__description-card--neither"
        >
          <div className="quiz-editor__description-header">
            <div>
              <p className="quiz-editor__section-eyebrow">Fallback Result</p>
              <h3 className="quiz-editor__description-name">Neither</h3>
            </div>
            <span className="quiz-editor__description-count">
              {countWords(neitherDescription)} words
            </span>
          </div>

          <Textarea
            value={neitherDescription}
            onChange={(e) => onUpdateNeither(e.target.value)}
            rows={5}
            style={{ textAlign: 'left' }}
          />
        </Card>
      </div>
    </div>
  );
};

export default DescriptionsTab;
