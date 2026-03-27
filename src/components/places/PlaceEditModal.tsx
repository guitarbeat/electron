import React, { useEffect, useRef, useState } from 'react';
import type { Place } from '@/shared/types';
import { colors, radius, spacing, typography, motion } from '@/theme/tokens';

const CATEGORIES = [
  '', 'Restaurant', 'Cafe', 'Bar', 'Park', 'Museum', 'Theater',
  'Shop', 'Hotel', 'Beach', 'Landmark', 'Nature', 'Other',
];

interface PlaceEditModalProps {
  place: Place;
  onSave: (id: string, updates: Partial<Pick<Place, 'name' | 'notes' | 'category'>>) => Promise<void>;
  onClose: () => void;
}

const PlaceEditModal: React.FC<PlaceEditModalProps> = ({ place, onSave, onClose }) => {
  const [name, setName] = useState(place.name);
  const [notes, setNotes] = useState(place.notes ?? '');
  const [category, setCategory] = useState(place.category ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required.'); return; }
    setIsSaving(true);
    setError('');
    try {
      await onSave(place.id, {
        name: trimmed,
        notes: notes.trim() || undefined,
        category: category || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const glass: React.CSSProperties = {
    background: 'rgba(22, 14, 8, 0.94)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.heading.join(', '),
    fontSize: typography.fontSize.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    outline: 'none',
    transition: `border-color ${motion.duration.fast}`,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: typography.fontFamily.heading.join(', '),
    fontSize: typography.fontSize.xs,
    letterSpacing: '0.08em',
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${place.name}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ ...glass, width: '100%', maxWidth: '420px', padding: spacing.xl }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <h2 style={{
            margin: 0,
            fontFamily: typography.fontFamily.heading.join(', '),
            fontSize: typography.fontSize.lg,
            color: colors.textPrimary,
            letterSpacing: '0.02em',
          }}>
            Edit place
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: colors.textTertiary,
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: spacing.xs,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Place name"
              required
              style={{
                ...inputStyle,
                borderColor: error ? 'rgba(220,80,60,0.7)' : colors.border,
              }}
            />
            {error && (
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: typography.fontSize.xs, color: '#f87171' }}>
                {error}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '32px',
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: '#1a0e08' }}>
                  {c === '' ? 'No category' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes…"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '72px',
                lineHeight: typography.lineHeight.relaxed,
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end', paddingTop: spacing.xs }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                background: 'transparent',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.sm,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              style={{
                padding: `${spacing.sm} ${spacing.lg}`,
                background: name.trim() && !isSaving ? colors.accent : colors.border,
                color: name.trim() && !isSaving ? '#fff' : colors.textTertiary,
                border: 'none',
                borderRadius: radius.md,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.sm,
                cursor: name.trim() && !isSaving ? 'pointer' : 'not-allowed',
                transition: `all ${motion.duration.fast}`,
              }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceEditModal;
