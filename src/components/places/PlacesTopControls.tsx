import React from 'react';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import { PlusIcon } from '@/common/icons';
import { colors, spacing, typography } from '@/design-system';

interface PlacesTopControlsProps {
  nameInput: string;
  notesInput: string;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
}

const PlacesTopControls: React.FC<PlacesTopControlsProps> = ({
  nameInput,
  notesInput,
  nameInputRef,
  isSubmitting,
  onNameChange,
  onNotesChange,
  onSubmit,
}) => {
  return (
    <Card
      variant="elevated"
      style={{
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${colors.borderSubtle}`,
      }}
    >
      <h2 style={{ ...typography.presets.titleSm, margin: 0, fontSize: '1.25rem' }}>Add new spot</h2>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Input
          ref={nameInputRef}
          value={nameInput}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Place name or address"
          aria-label="Place name"
          fullWidth
        />
        <Input
          value={notesInput}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Notes (optional)"
          aria-label="Notes"
          fullWidth
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!nameInput.trim() || isSubmitting}
          isLoading={isSubmitting}
          style={{ alignSelf: 'flex-start', minWidth: '140px' }}
        >
          <PlusIcon style={{ width: 16, height: 16 }} />
          Add spot
        </Button>
      </form>
    </Card>
  );
};

export default React.memo(PlacesTopControls);
