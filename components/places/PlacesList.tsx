import React, { useState, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { usePlaces } from '../../hooks/usePlaces';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import { PlusIcon, TrashIcon, CheckIcon } from '../common/icons';
import { colors, spacing, typography, radius } from '../../design-system/tokens';
import type { Place } from '../../types';

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: colors.textPrimary,
  fontFamily: typography.fontFamily.heading.join(', '),
  fontSize: typography.fontSize.lg,
  letterSpacing: '0.03em',
};

type PlaceFilter = 'want' | 'visited';

const PlacesList: React.FC = () => {
  const { currentUser } = useUser();
  const {
    places,
    isLoading,
    isSubmitting,
    addPlace,
    removePlace,
    markVisited,
    markUnvisited,
  } = usePlaces(currentUser);

  const [filter, setFilter] = useState<PlaceFilter>('want');
  const [nameInput, setNameInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);

  const filtered = filter === 'want'
    ? places.filter((p) => !p.visitedAt)
    : places.filter((p) => p.visitedAt);

  const handleAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const name = nameInput.trim();
      if (!name || isSubmitting) return;
      try {
        await addPlace(name, notesInput.trim() || undefined);
        setNameInput('');
        setNotesInput('');
      } catch (err) {
        console.error(err);
      }
    },
    [nameInput, notesInput, isSubmitting, addPlace]
  );

  const confirmDelete = useCallback(async () => {
    if (!placeToDelete) return;
    try {
      await removePlace(placeToDelete.id);
      setPlaceToDelete(null);
    } catch (err) {
      console.error(err);
    }
  }, [placeToDelete, removePlace]);

  if (isLoading && places.length === 0) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: spacing.md }}>
        <p style={{ color: colors.textSecondary }}>Loading places…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: spacing.md, display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <h1 style={{ ...sectionTitleStyle, marginBottom: spacing.xs }}>Places we want to go</h1>
      <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
        Add places you’d like to visit together. Mark them when you’ve been.
      </p>

      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <Input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Place name or address"
          aria-label="Place name"
          style={{ maxWidth: 400 }}
        />
        <Input
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          placeholder="Notes (optional)"
          aria-label="Notes"
          style={{ maxWidth: 400 }}
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={!nameInput.trim() || isSubmitting}
          style={{ alignSelf: 'flex-start' }}
        >
          <PlusIcon style={{ width: 18, height: 18 }} />
          Add place
        </Button>
      </form>

      <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilter('want')}
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: radius.md,
            border: `1px solid ${filter === 'want' ? colors.accent : colors.borderSecondary}40`,
            background: filter === 'want' ? colors.accentMuted : 'transparent',
            color: filter === 'want' ? colors.accent : colors.textSecondary,
            fontSize: typography.fontSize.sm,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Want to go
        </button>
        <button
          type="button"
          onClick={() => setFilter('visited')}
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: radius.md,
            border: `1px solid ${filter === 'visited' ? colors.secondary : colors.borderSecondary}40`,
            background: filter === 'visited' ? colors.secondaryMuted : 'transparent',
            color: filter === 'visited' ? colors.secondary : colors.textSecondary,
            fontSize: typography.fontSize.sm,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Visited
        </button>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {filtered.length === 0 && (
          <li style={{ color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
            {filter === 'want' ? 'No places yet. Add one above.' : 'No visited places yet.'}
          </li>
        )}
        {filtered.map((place) => (
          <li key={place.id}>
            <Card
              style={{
                padding: spacing.md,
                border: `1px solid ${colors.borderSecondary}35`,
                borderRadius: radius.lg,
                background: colors.surface,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                <div>
                  <span style={{ fontWeight: 600, color: colors.textPrimary }}>{place.name}</span>
                  {place.visitedAt && (
                    <span
                      style={{
                        marginLeft: spacing.sm,
                        padding: '2px 8px',
                        borderRadius: radius.sm,
                        background: colors.secondaryMuted,
                        color: colors.secondary,
                        fontSize: typography.fontSize.xs,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckIcon style={{ width: 12, height: 12 }} />
                      Visited
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: spacing.xs }}>
                  {place.visitedAt ? (
                    <Button size="sm" variant="ghost" onClick={() => markUnvisited(place.id)} disabled={isSubmitting}>
                      Mark unvisited
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => markVisited(place.id)} disabled={isSubmitting}>
                      Mark visited
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPlaceToDelete(place)}
                    disabled={isSubmitting}
                    style={{ color: colors.error }}
                    aria-label={`Delete ${place.name}`}
                  >
                    <TrashIcon style={{ width: 18, height: 18 }} />
                  </Button>
                </div>
              </div>
              {place.notes && (
                <p style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.textSecondary }}>{place.notes}</p>
              )}
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={!!placeToDelete}
        title="Remove place"
        message={placeToDelete ? `Remove "${placeToDelete.name}" from the list?` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setPlaceToDelete(null)}
      />
    </div>
  );
};

export default PlacesList;
