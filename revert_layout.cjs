const fs = require('fs');

// Revert MovieCard.tsx
let cardContent = fs.readFileSync('apps/web/src/components/movies/MovieCard.tsx', 'utf8');
cardContent = cardContent.replace(
  'import { MovieEditModal } from "./MovieEditModal";\nimport { motion } from "motion/react";',
  'import { MovieEditModal } from "./MovieEditModal";'
);
cardContent = cardContent.replace(
  /<motion\.div layoutId=\{\`book-\$\{movie\.id\}\`\} style=\{\{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden" \}\}>\n            <MediaCardPosterWrap/g,
  '<MediaCardPosterWrap'
);
cardContent = cardContent.replace(
  /            <\/MediaCardPosterWrap>\n            <\/motion\.div>/g,
  '            </MediaCardPosterWrap>'
);
fs.writeFileSync('apps/web/src/components/movies/MovieCard.tsx', cardContent, 'utf8');

// Revert shared.tsx (PosterHero)
let sharedContent = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');
sharedContent = sharedContent.replace(
  'import { motion } from "motion/react";\nimport {',
  'import {'
);
sharedContent = sharedContent.replace(
  /<motion\.div layoutId=\{\`book-\$\{movie\.id\}\`\}>\n          <PageFlip/g,
  '<PageFlip'
);
sharedContent = sharedContent.replace(
  /            forceClose=\{\!isOpen\}\n          \/>\n          <\/motion\.div>/g,
  '            forceClose={!isOpen}\n          />'
);
sharedContent = sharedContent.replace(
  /<motion\.div layoutId=\{\!isMobileBookletOpen \? \`book-\$\{movie\.id\}\` : undefined\} className="w-full h-full">\n          <img/g,
  '<img'
);
sharedContent = sharedContent.replace(
  /            onClick=\{\(\) => setIsMobileBookletOpen\(true\)\}\n          \/>\n        <\/motion\.div>/g,
  '            onClick={() => setIsMobileBookletOpen(true)}\n          />'
);
sharedContent = sharedContent.replace(
  /<motion\.div layoutId=\{\`book-\$\{movie\.id\}\`\}>\n          <PageFlip/g,
  '<PageFlip'
);
fs.writeFileSync('apps/web/src/components/movies/shared.tsx', sharedContent, 'utf8');

console.log("Reverted layout IDs");
