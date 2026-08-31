const fs = require('fs');

// Patch MovieCard.tsx
let cardContent = fs.readFileSync('apps/web/src/components/movies/MovieCard.tsx', 'utf8');
cardContent = cardContent.replace(
  'import { MovieEditModal } from "./MovieEditModal";',
  'import { MovieEditModal } from "./MovieEditModal";\nimport { motion } from "motion/react";'
);
// Wrap MediaCardPosterWrap with motion.div
cardContent = cardContent.replace(
  /            <MediaCardPosterWrap\n              ref=\{posterRef\}\n              className="movie-item-poster-wrap"\n            >/,
  '            <motion.div layoutId={`book-${movie.id}`} style={{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden" }}>\n            <MediaCardPosterWrap\n              ref={posterRef}\n              className="movie-item-poster-wrap"\n            >'
);
cardContent = cardContent.replace(
  /            <\/MediaCardPosterWrap>/,
  '            </MediaCardPosterWrap>\n            </motion.div>'
);
fs.writeFileSync('apps/web/src/components/movies/MovieCard.tsx', cardContent, 'utf8');

// Patch shared.tsx (PosterHero)
let sharedContent = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');
sharedContent = sharedContent.replace(
  'import {',
  'import { motion } from "motion/react";\nimport {'
);
sharedContent = sharedContent.replace(
  /        <div \n          className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 pt-10"\n          onClick=\{\(e\) => \{\n            if \(e\.target === e\.currentTarget\) \{\n              onClose\?\.\(\);\n            \}\n          \}\}\n        >/,
  '        <div \n          className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 pt-10"\n          onClick={(e) => {\n            if (e.target === e.currentTarget) {\n              onClose?.();\n            }\n          }}\n        >\n          <motion.div layoutId={`book-${movie.id}`}>'
);
sharedContent = sharedContent.replace(
  /            forceClose=\{\!isOpen\}\n          \/>\n        <\/div>/,
  '            forceClose={!isOpen}\n          />\n          </motion.div>\n        </div>'
);
// Also for mobile overlay
sharedContent = sharedContent.replace(
  /        <>\n          <img/,
  '        <motion.div layoutId={`book-${movie.id}`} className="w-full h-full">\n          <img'
);
sharedContent = sharedContent.replace(
  /            onClick=\{\(\) => setIsMobileBookletOpen\(true\)\}\n          \/>\n        <\/>/,
  '            onClick={() => setIsMobileBookletOpen(true)}\n          />\n        </motion.div>'
);
// And the mobile PageFlip
sharedContent = sharedContent.replace(
  /          <button\n            type="button"\n            onClick=\{\(\) => setIsMobileBookletOpen\(false\)\}\n            className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white\/10 text-white hover:bg-white\/20 border border-white\/20 text-lg transition cursor-pointer"\n            aria-label="Close 3D booklet"\n          >\n            ✕\n          <\/button>\n          <PageFlip/,
  '          <button\n            type="button"\n            onClick={() => setIsMobileBookletOpen(false)}\n            className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 text-lg transition cursor-pointer"\n            aria-label="Close 3D booklet"\n          >\n            ✕\n          </button>\n          <motion.div layoutId={`book-${movie.id}`}>\n          <PageFlip'
);
sharedContent = sharedContent.replace(
  /            forceClose=\{\!isOpen\}\n          \/>\n          <div className="flex items-center gap-1\.5 mt-6 px-3 py-1\.5 rounded-full bg-white\/10 border border-white\/15 backdrop-blur-md">/,
  '            forceClose={!isOpen}\n          />\n          </motion.div>\n          <div className="flex items-center gap-1.5 mt-6 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">'
);
fs.writeFileSync('apps/web/src/components/movies/shared.tsx', sharedContent, 'utf8');

console.log("Patched layout IDs");
