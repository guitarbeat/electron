const fs = require('fs');

function processFile(path, processors) {
  let content = fs.readFileSync(path, 'utf8');
  for (const proc of processors) {
    content = proc(content);
  }
  fs.writeFileSync(path, content);
}

// 1. MovieCard.tsx
processFile('src/components/movies/MovieCard.tsx', [
  (c) => c.replace(/MediaCardInfo,\n  MediaCardOverlay,\n  MediaCardSuccessBadge,\n/, ''),
  (c) => c.replace(/import { Button } from '\.\.\/ui\/Button';\n/, ''),
  (c) => c.replace(/import { colors } from '\.\.\/\.\.\/theme\/tokens';\n/, ''),
  (c) => c.replace(/import { MediaCardMetadata } from '\.\.\/common\/MediaCard\/MediaCardMetadata';\n/, ''),
  (c) => c.replace(/const featuredMemory = [\s\S]*?(?=\n\n)/, ''),
  (c) => c.replace(/const MovieMemoryPreview = [\s\S]*?(?=\n\n)/, '')
]);

// 2. PlaceCard.tsx
processFile('src/components/places/PlaceCard.tsx', [
  (c) => c.replace(/import { Button } from '\.\.\/ui\/Button';\n/, '')
]);

// 3. Skeleton.tsx
processFile('src/components/ui/Skeleton.tsx', [
  (c) => c.replace(/import { radius, colors, spacing, shadows } from '\.\.\/\.\.\/theme\/tokens\.ts';\n/, "import { radius } from '../../theme/tokens.ts';\n")
]);

// 4. MoviesView.tsx
processFile('src/components/movies/MoviesView.tsx', [
  (c) => c.replace(/,\n    addMemory,\n    deleteMemoryRecord,\n    handleToggleError,\n    movieMemories,\n    renameMovie,\n    setMovieToDelete,\n    successMovieId,\n    toggleMemoryPin,\n    toggleWatched,\n    updateMemory/, '')
]);

// 5. MoviesTopControls.tsx
try {
processFile('src/components/movies/MoviesTopControls.tsx', [
  (c) => c.replace(/const selectedAutocompleteResult = [\s\S]*?(?=\n\n)/, '')
]);
} catch (e) {}

// 6. PlacesList.tsx
try {
processFile('src/components/places/PlacesList.tsx', [
  (c) => c.replace(/import { radius } from '\.\.\/\.\.\/theme\/tokens\.ts';\n/, ''),
  (c) => c.replace(/It's/g, 'It&apos;s'),
  (c) => c.replace(/don't/g, 'don&apos;t')
]);
} catch (e) {}

// 7. CinematicLandingHero.tsx
try {
processFile('src/components/ui/CinematicLandingHero.tsx', [
  (c) => c.replace(/import React from 'react';\n/, ''),
  (c) => c.replace(/It's/g, 'It&apos;s'),
  (c) => c.replace(/you're/g, 'you&apos;re')
]);
} catch (e) {}

// 8. WatcherBadge.tsx
try {
processFile('src/components/common/WatcherBadge.tsx', [
  (c) => c.replace(/export const MIN_WATCHERS_FOR_BADGE = 2;\n\n/, ''),
]);
} catch (e) {}

// 9. AppHeaderSlot.tsx
try {
processFile('src/app/AppHeaderSlot.tsx', [
  (c) => c.replace(/export const AppHeaderContext = createContext<AppHeaderContextType \| undefined>\(undefined\);\n\n/, ''),
  (c) => c.replace(/export const useAppHeader = \(\) => {\n  const context = useContext\(AppHeaderContext\);\n  if \(\!context\) {\n    throw new Error\('useAppHeader must be used within an AppHeaderSlot'\);\n  }\n  return context;\n};\n\n/, ''),
]);
} catch (e) {}
