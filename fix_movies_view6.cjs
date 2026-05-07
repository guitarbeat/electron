const fs = require('fs');
let content = fs.readFileSync('src/components/movies/MoviesView.tsx', 'utf8');

let parts = content.split('  }, [\n    addMemory,\n');
if (parts.length > 1) {
  let remaining = parts[1];
  remaining = remaining.replace(/    deleteMemoryRecord,\n/g, '');
  remaining = remaining.replace(/    handleToggleError,\n/g, '');
  remaining = remaining.replace(/    movieMemories,\n/g, '');
  remaining = remaining.replace(/    renameMovie,\n/g, '');
  remaining = remaining.replace(/    successMovieId,\n/g, '');
  remaining = remaining.replace(/    toggleMemoryPin,\n/g, '');
  remaining = remaining.replace(/    toggleWatched,\n/g, '');
  remaining = remaining.replace(/    updateMemory,\n/g, '');
  remaining = remaining.replace(/    setMovieToDelete,\n/g, '');

  content = parts[0] + '  }, [\n' + remaining;
}

fs.writeFileSync('src/components/movies/MoviesView.tsx', content);
