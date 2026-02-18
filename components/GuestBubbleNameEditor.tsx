import React from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import { colors, radius, spacing, typography } from '../design-system/tokens';
import { SparkleHeartIcon } from './icons';

interface GuestBubbleNameEditorProps {
  draftName: string;
  savedName: string;
  error?: string | null;
  isSaveConfirmed?: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
  onClose?: () => void;
}

const GuestBubbleNameEditor: React.FC<GuestBubbleNameEditorProps> = ({
  draftName,
  savedName,
  error,
  isSaveConfirmed = false,
  onDraftChange,
  onSave,
  onClear,
  onClose,
}) => {
  const isEditing = Boolean(savedName);
  const title = isEditing ? 'Edit Guest Bubble' : 'Create Guest Bubble';
  const helperText = isEditing
    ? 'Update the name and keep suggesting instantly.'
    : 'Create your one-tap guest identity for suggestions.';
  const entranceEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div
      className="guest-editor-panel"
      style={{
        marginTop: spacing.sm,
        padding: spacing.md,
        border: `1px solid ${colors.borderSecondary}35`,
        borderRadius: radius.lg,
        background:
          'radial-gradient(120% 140% at 15% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%), linear-gradient(145deg, rgba(20, 33, 60, 0.94), rgba(16, 24, 44, 0.9))',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255,255,255,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        position: 'relative',
        overflow: 'hidden',
        animation: `guest-editor-rise 260ms ${entranceEasing}`,
        transition: `box-shadow 200ms ${entranceEasing}, border-color 200ms ${entranceEasing}`,
      }}
    >
      <style>
        {`@keyframes guest-editor-rise { from { opacity: 0; transform: translateY(10px) scale(0.982); } to { opacity: 1; transform: translateY(0) scale(1);} }
          @keyframes guest-editor-sheen { 0% { transform: translateX(-170%); } 100% { transform: translateX(190%); } }
          @keyframes guest-editor-emphasize { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-1px) scale(1.01); } 100% { transform: translateY(0) scale(1); } }
          @media (prefers-reduced-motion: reduce) {
            .guest-editor-panel, .guest-editor-panel * { animation: none !important; transition: none !important; }
          }`}
      </style>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '36%',
          height: '100%',
          transform: 'skewX(-18deg)',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(255,255,255,0))',
          animation: 'guest-editor-sheen 3.6s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          animation: `guest-editor-rise 220ms ${entranceEasing}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              color: '#e8f3ff',
              fontFamily: typography.fontFamily.heading.join(', '),
              fontSize: typography.fontSize.sm,
              letterSpacing: typography.letterSpacing.wide,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: `${spacing.xs} 0 0`,
              color: '#b7cbe8',
              fontSize: typography.fontSize.xs,
            }}
          >
            {helperText}
          </p>
        </div>
        <span
          style={{
            borderRadius: radius.full,
            border: `1px solid ${isEditing ? '#6cb5ff80' : '#ffc27a70'}`,
            background: isEditing ? 'rgba(108, 181, 255, 0.14)' : 'rgba(255, 194, 122, 0.12)',
            color: isEditing ? '#bfe2ff' : '#ffe7bf',
            padding: `0.25rem 0.6rem`,
            fontSize: typography.fontSize.xs,
            whiteSpace: 'nowrap',
          }}
        >
          {isEditing ? 'Edit Mode' : 'Create Mode'}
        </span>
      </div>
      <Input
        value={draftName}
        onChange={(event) => onDraftChange(event.target.value)}
        label="Guest bubble name"
        placeholder="Example: Maya"
        aria-label="Guest bubble name"
        autoFocus
        style={{
          height: '44px',
          transition: `border-color 160ms ${entranceEasing}, box-shadow 160ms ${entranceEasing}`,
        }}
      />
      {error && (
        <p
          style={{
            margin: 0,
            color: colors.error,
            fontSize: typography.fontSize.xs,
          }}
        >
          {error}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          flexWrap: 'wrap',
          justifyContent: 'center',
          animation: `guest-editor-rise 260ms ${entranceEasing}`,
        }}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={onSave}
          style={{
            minHeight: '44px',
            width: 'auto',
            transition: `transform 170ms ${entranceEasing}, box-shadow 170ms ${entranceEasing}`,
            animation: isSaveConfirmed ? 'guest-editor-emphasize 420ms ease-out' : undefined,
          }}
        >
          <SparkleHeartIcon style={{ width: '1rem', height: '1rem' }} />
          {isSaveConfirmed ? `Saved as ${savedName}` : 'Save Guest Bubble'}
        </Button>
        {savedName && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            style={{ minHeight: '44px', width: 'auto' }}
          >
            Clear
          </Button>
        )}
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            style={{ minHeight: '44px', width: 'auto' }}
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
};

export default GuestBubbleNameEditor;
