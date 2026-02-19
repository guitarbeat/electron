import React, { useRef } from 'react';
import { ImageChoiceQuestion } from '../types';
import ScoreSlider from '../ScoreSlider';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { spacing, colors, typography, radius } from '../../../design-system/tokens';

interface ImageChoiceEditorProps {
  question: ImageChoiceQuestion;
  onChange: (q: ImageChoiceQuestion) => void;
}

const ImageChoiceEditor: React.FC<ImageChoiceEditorProps> = ({ question, onChange }) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateOption = (index: number, field: 'imageUrl' | 'alt', value: string) => {
    const newOptions = [...question.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange({ ...question, options: newOptions });
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 500 * 1024) {
      alert('Image too large. Please use an image under 500KB for Gist storage.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const newOptions = [...question.options];
      newOptions[index] = {
        ...newOptions[index],
        imageUrl: base64,
        alt: newOptions[index].alt || file.name.replace(/\.[^/.]+$/, ''),
      };
      onChange({ ...question, options: newOptions });
    };
    reader.readAsDataURL(file);
  };

  const addOption = () => {
    onChange({
      ...question,
      options: [...question.options, { imageUrl: '', alt: 'New image', scores: {} }],
    });
  };

  const removeOption = (index: number) => {
    if (question.options.length <= 2) return;
    onChange({
      ...question,
      options: question.options.filter((_, i) => i !== index),
    });
  };

  const isBase64Image = (url: string) => url.startsWith('data:image');

  return (
    <div>
      <h3 style={{ fontSize: typography.fontSize.lg, marginBottom: spacing.md }}>Image Options</h3>
      <p
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.textTertiary,
          marginBottom: spacing.lg,
        }}
      >
        Upload images (under 500KB) or enter URLs to existing images in /quiz-photos/
      </p>
      {question.options.map((option, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
          }}
        >
          {/* Image Preview & Upload */}
          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              marginBottom: spacing.md,
              alignItems: 'flex-start',
            }}
          >
            {/* Preview */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: radius.md,
                border: `2px dashed ${colors.borderSecondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: colors.background,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              onClick={() => fileInputRefs.current[idx]?.click()}
            >
              {option.imageUrl ? (
                <img
                  src={option.imageUrl}
                  alt={option.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: spacing.sm,
                    color: colors.textTertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  Click to upload
                </div>
              )}
            </div>

            {/* Upload & URL inputs */}
            <div style={{ flex: 1 }}>
              <input
                ref={(el) => {
                  fileInputRefs.current[idx] = el;
                }}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(idx, file);
                }}
              />

              <div style={{ marginBottom: spacing.sm }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  style={{ width: '100%' }}
                >
                  📷 Upload Image
                </Button>
              </div>

              <Input
                label="Or enter URL"
                value={isBase64Image(option.imageUrl) ? '(uploaded image)' : option.imageUrl}
                onChange={(e) => updateOption(idx, 'imageUrl', e.target.value)}
                placeholder="/quiz-photos/quiz-img-1.png"
                style={{ textAlign: 'left' }}
                disabled={isBase64Image(option.imageUrl)}
              />

              {isBase64Image(option.imageUrl) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateOption(idx, 'imageUrl', '')}
                  style={{ marginTop: spacing.xs, fontSize: typography.fontSize.xs }}
                >
                  Clear uploaded image
                </Button>
              )}
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => removeOption(idx)}
              disabled={question.options.length <= 2}
              style={{ flexShrink: 0 }}
            >
              ✕
            </Button>
          </div>

          {/* Alt text */}
          <div style={{ marginBottom: spacing.sm }}>
            <Input
              label="Alt Text (description)"
              value={option.alt}
              onChange={(e) => updateOption(idx, 'alt', e.target.value)}
              placeholder="Description of the image"
              style={{ textAlign: 'left' }}
            />
          </div>

          {/* Scores */}
          <ScoreSlider
            scores={option.scores}
            onChange={(scores) => {
              const newOptions = [...question.options];
              newOptions[idx] = { ...newOptions[idx], scores };
              onChange({ ...question, options: newOptions });
            }}
          />
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addOption}>
        + Add Image Option
      </Button>
    </div>
  );
};

export default ImageChoiceEditor;
