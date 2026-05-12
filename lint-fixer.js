import fs from 'fs';

const fixFile = (file) => {
  let code = fs.readFileSync(file, 'utf-8');

  if (file.includes('MovieCard.tsx')) {
    code = code.replace(/import { MediaCardInfo } from '.*';\n/, '');
    code = code.replace(/import { MediaCardOverlay } from '.*';\n/, '');
    code = code.replace(/import { MediaCardSuccessBadge } from '.*';\n/, '');
    code = code.replace(/import Button from '.*';\n/, '');
    code = code.replace(/import { colors } from '.*';\n/, '');
    code = code.replace(/import { MediaCardMetadata } from '.*';\n/, '');
    code = code.replace(/const featuredMemory = .*;\n/, '');
    code = code.replace(/import { MovieMemoryPreview } from '.*';\n/, '');
    code = code.replace(/<MovieMemoryPreview[^\>]*\/>/g, '');
  }

  if (file.includes('PlaceCard.tsx')) {
    code = code.replace(/import Button from '.*';\n/, '');
  }

  if (file.includes('MoviesTopControls.tsx')) {
    code = code.replace(/selectedAutocompleteResult: MovieAutocompleteResult \| null;\n/, '');
    code = code.replace(/selectedAutocompleteResult,\n/, '');
    code = code.replace(/if \(!shouldFetchMovieAutocomplete\(trimmedSearchQuery, selectedAutocompleteResult\)\) {\n\s*return;\n\s*}\n/, '');
    code = code.replace(/if \(shouldClearSelectedMovieResult\(nextValue, selectedAutocompleteResult\)\) {\n\s*setSelectedAutocompleteResult\(null\);\n\s*}\n/, '');
    code = code.replace(/import {.*?shouldClearSelectedMovieResult.*?shouldFetchMovieAutocomplete.*?}.*;\n/s, (match) => {
      return match.replace('shouldClearSelectedMovieResult,', '').replace('shouldFetchMovieAutocomplete,', '');
    });
    code = code.replace(/selectedAutocompleteResult,\n/g, '');
  }

  if (file.includes('Skeleton.tsx')) {
    code = code.replace(/import { colors, radius, spacing, shadows } from '@\/theme\/tokens';/, "import { radius } from '@/theme/tokens';");
  }

  if (file.includes('PlacesList.tsx')) {
    code = code.replace(/import { radius } from '..\/..\/theme\/tokens.ts';\n/, '');
    code = code.replace(/import { radius } from '.*';\n/, '');
    code = code.replace(/const PlacesMap = .*;\n/, '');
    code = code.replace(/import { MovieCardSkeleton } from '.*';\n/, '');
    code = code.replace(/import SyncBanner from '.*';\n/, '');
    code = code.replace(/import PlaceSuggestionCard from '.*';\n/, '');
    code = code.replace(/import PlacesTopControls from '.*';\n/, '');
  }

  fs.writeFileSync(file, code);
};

['src/components/movies/MovieCard.tsx', 'src/components/places/PlaceCard.tsx', 'src/components/movies/MoviesTopControls.tsx', 'src/components/ui/Skeleton.tsx', 'src/components/places/PlacesList.tsx'].forEach(fixFile);
