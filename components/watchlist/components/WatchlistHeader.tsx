import React from 'react';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import IconButton from '../../ui/IconButton';
import { PlusIcon, Spinner } from '../../icons';
import { colors, spacing, radius } from '../../../design-system/tokens';

interface WatchlistHeaderProps {
  newMovieTitle: string;
  setNewMovieTitle: (title: string) => void;
  isAdding: boolean;
  onAddMovie: (e: React.FormEvent) => void;
}

export const WatchlistHeader: React.FC<WatchlistHeaderProps> = ({
  newMovieTitle,
  setNewMovieTitle,
  isAdding,
  onAddMovie,
}) => {
  return (
    <Card
      variant="elevated"
      style={{
        padding: spacing.md,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
        border: `1px solid ${colors.borderSecondary}40`,
      }}
    >
      <form
        onSubmit={onAddMovie}
        style={{ display: 'flex', flex: 1, gap: spacing.sm, alignItems: 'center' }}
      >
        <Input
          value={newMovieTitle}
          onChange={(e) => setNewMovieTitle(e.target.value)}
          placeholder="Add a movie or show..."
          disabled={isAdding}
          autoFocus
          style={{
            flex: 1,
            border: 'none',
            fontSize: '16px',
            backgroundColor: 'transparent',
            boxShadow: 'none',
          }}
        />
        <IconButton
          type="submit"
          disabled={!newMovieTitle.trim() || isAdding}
          variant="default"
          aria-label="Add movie"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: radius.full,
          }}
        >
          {isAdding ? <Spinner /> : <PlusIcon />}
        </IconButton>
      </form>
    </Card>
  );
};
