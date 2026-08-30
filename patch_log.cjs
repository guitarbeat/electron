const fs = require('fs');

let content = fs.readFileSync('apps/web/src/components/movies/MovieCard.tsx', 'utf8');
content = content.replace(
  'const handleOpenDetails = (e?: React.MouseEvent) => {',
  'const handleOpenDetails = (e?: React.MouseEvent) => {\n    console.log("MovieCard handleOpenDetails", e);'
);
content = content.replace(
  '    if (origin) {',
  '    console.log("MovieCard origin", origin);\n    if (origin) {'
);
fs.writeFileSync('apps/web/src/components/movies/MovieCard.tsx', content, 'utf8');
console.log("Patched log in MovieCard");

let bodyContent = fs.readFileSync('apps/web/src/components/movies/MovieSectionBody.tsx', 'utf8');
bodyContent = bodyContent.replace(
  '          onOpenDetails={(m, origin) => {',
  '          onOpenDetails={(m, origin) => {\n            console.log("MovieSectionBody onOpenDetails", m, origin);'
);
bodyContent = bodyContent.replace(
  '  const handleTileClick = (item: unknown) => {',
  '  const handleTileClick = (item: unknown) => {\n    console.log("MovieSectionBody handleTileClick", item);'
);
fs.writeFileSync('apps/web/src/components/movies/MovieSectionBody.tsx', bodyContent, 'utf8');
console.log("Patched log in MovieSectionBody");

let modalContent = fs.readFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', 'utf8');
modalContent = modalContent.replace(
  '  const source = clampMovieTransitionOrigin(origin ?? null);',
  '  console.log("MovieDetailsModal origin prop", origin);\n  const source = clampMovieTransitionOrigin(origin ?? null);\n  console.log("MovieDetailsModal clamped source", source);'
);
fs.writeFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', modalContent, 'utf8');
console.log("Patched log in MovieDetailsModal");
