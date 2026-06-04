const fs = require('fs');
let content = fs.readFileSync('src/components/movies/MoviesView.tsx', 'utf8');

const regexes = [
  /addMemory,\n\s*/g,
  /deleteMemoryRecord,\n\s*/g,
  /handleToggleError,\n\s*/g,
  /movieMemories,\n\s*/g,
  /renameMovie,\n\s*/g,
  /setMovieToDelete,\n\s*/g,
  /successMovieId,\n\s*/g,
  /toggleMemoryPin,\n\s*/g,
  /toggleWatched,\n\s*/g,
  /updateMemory,\n\s*/g
];

let parts = content.split('  }, [\n');
if (parts.length > 2) {
  let depsList = parts[2];
  let bracketIndex = depsList.indexOf(']');
  let deps = depsList.substring(0, bracketIndex);

  regexes.forEach(regex => {
    deps = deps.replace(regex, '');
  });

  parts[2] = deps + depsList.substring(bracketIndex);
  content = parts.join('  }, [\n');
}

fs.writeFileSync('src/components/movies/MoviesView.tsx', content);
