const fs = require('fs');

function fixPlacesList() {
  const path = 'src/components/places/PlacesList.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/import { radius } from '\.\.\/\.\.\/theme\/tokens\.ts';\n/, '');
  content = content.replace(/you'd/g, "you&apos;d");
  fs.writeFileSync(path, content);
}

function fixPlaceCard() {
  const path = 'src/components/places/PlaceCard.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/import Button from '@\/ui\/Button';\n/, '');
  fs.writeFileSync(path, content);
}

function fixMoviesTopControls() {
  const path = 'src/components/movies/MoviesTopControls.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/  selectedAutocompleteResult: MovieAutocompleteResult \| null;\n/, '');
  content = content.replace(/  selectedAutocompleteResult,\n/, '');
  fs.writeFileSync(path, content);
}

function fixMovieCard() {
  const path = 'src/components/movies/MovieCard.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/  MediaCardInfo,\n/g, "");
  content = content.replace(/  MediaCardOverlay,\n/g, "");
  content = content.replace(/  MediaCardSuccessBadge,\n/g, "");
  content = content.replace(/import Button from '@\/ui\/Button';\n/g, "");
  content = content.replace(/import { colors } from '@\/theme\/tokens.ts';\n/g, "");
  content = content.replace(/import { colors } from '@\/theme\/tokens';\n/g, "");
  content = content.replace(/import { MediaCardMetadata } from '@\/ui\/MediaCard';\n/g, "");
  content = content.replace(/const featuredMemory = useMemo\(\(\) => \{\n    if \(\!memories \|\| memories\.length === 0\) return null;\n    return memories\.reduce\(\(latest, current\) =>\n      new Date\(current\.createdAt\) > new Date\(latest\.createdAt\) \? current : latest\n    \);\n  \}, \[memories\]\);\n/g, "");
  fs.writeFileSync(path, content);
}

function fixCinematicLandingHero() {
  const path = 'src/components/ui/CinematicLandingHero.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/import React, \{ useEffect, useRef, useState \} from 'react';/, "import { useEffect, useRef, useState } from 'react';");
  content = content.replace(/It's /g, "It&apos;s ");
  content = content.replace(/that's /g, "that&apos;s ");
  fs.writeFileSync(path, content);
}

function fixSkeleton() {
  const path = 'src/components/ui/Skeleton.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/import \{ colors, spacing, shadows \} from '\.\.\/\.\.\/theme\/tokens';\n/, '');
  fs.writeFileSync(path, content);
}

fixPlacesList();
fixPlaceCard();
fixMoviesTopControls();
fixMovieCard();
fixCinematicLandingHero();
fixSkeleton();
