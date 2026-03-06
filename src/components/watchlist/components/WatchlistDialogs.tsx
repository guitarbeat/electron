import React from 'react';
import ConfirmDialog from '@/ui/ConfirmDialog';
import FixMatchDialog from '@/common/FixMatchDialog';
import Confetti from '@/effects/Confetti';
import { Movie } from '@/types';

interface WatchlistDialogsProps {
  movieToDelete: Movie | null;
  setMovieToDelete: (movie: Movie | null) => void;
  fixMatchDialogMovie: Movie | null;
  setFixMatchDialogMovie: (movie: Movie | null) => void;
  successMovieId: string | null;
  setSuccessMovieId: (id: string | null) => void;
}

const WatchlistDialogs: React.FC<WatchlistDialogsProps> = ({
  movieToDelete,
  setMovieToDelete,
  fixMatchDialogMovie,
  setFixMatchDialogMovie,
  successMovieId,
  setSuccessMovieId,
}) => {
  return (
    <>
      {movieToDelete && (
        <ConfirmDialog
          isOpen={!!movieToDelete}
          onClose={() => setMovieToDelete(null)}
          title="Delete Movie"
          message={`Are you sure you want to delete "${movieToDelete.title}"?`}
          onConfirm={() => {
            // Handle delete logic here
            setMovieToDelete(null);
          }}
        />
      )}

      {fixMatchDialogMovie && (
        <FixMatchDialog
          isOpen={!!fixMatchDialogMovie}
          onClose={() => setFixMatchDialogMovie(null)}
          movie={fixMatchDialogMovie}
        />
      )}

      {successMovieId && (
        <Confetti
          trigger={successMovieId}
          onComplete={() => setSuccessMovieId(null)}
        />
      )}
    </>
  );
};

export default WatchlistDialogs;
