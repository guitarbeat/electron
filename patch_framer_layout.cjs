const fs = require('fs');

// Patch MovieCard.tsx
let cardContent = fs.readFileSync('apps/web/src/components/movies/MovieCard.tsx', 'utf8');

if (!cardContent.includes('import { motion } from "motion/react";')) {
  cardContent = cardContent.replace(
    'import { MovieEditModal } from "./MovieEditModal";',
    'import { MovieEditModal } from "./MovieEditModal";\nimport { motion } from "motion/react";'
  );
}

if (!cardContent.includes('<motion.div layoutId={`book-${movie.id}`}')) {
  cardContent = cardContent.replace(
    /            <MediaCardPosterWrap\n              ref=\{posterRef\}\n              className="movie-item-poster-wrap"\n            >/,
    '            <motion.div layoutId={`book-${movie.id}`} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} className="movie-item-poster-wrap-motion">\n            <MediaCardPosterWrap\n              ref={posterRef}\n              className="movie-item-poster-wrap"\n            >'
  );
  cardContent = cardContent.replace(
    /              <\/MediaCardPosterWrap>\n          <\/Card>/,
    '              </MediaCardPosterWrap>\n            </motion.div>\n          </Card>'
  );
}
fs.writeFileSync('apps/web/src/components/movies/MovieCard.tsx', cardContent, 'utf8');


// Patch shared.tsx
let sharedContent = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');

if (!sharedContent.includes('import { motion } from "motion/react";')) {
  sharedContent = sharedContent.replace(
    'import {',
    'import { motion } from "motion/react";\nimport {'
  );
}

if (!sharedContent.includes('layoutId={`book-${movie.id}`}')) {
  // Desktop PageFlip
  sharedContent = sharedContent.replace(
    /          <PageFlip\n            pages=\{pages as any\}\n            pageWidth=\{280\}/,
    '          <motion.div layoutId={`book-${movie.id}`} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>\n          <PageFlip\n            pages={pages as any}\n            pageWidth={280}'
  );
  sharedContent = sharedContent.replace(
    /            forceClose=\{\!isOpen\}\n          \/>\n        <\/div>/,
    '            forceClose={!isOpen}\n          />\n          </motion.div>\n        </div>'
  );

  // Mobile inline image
  sharedContent = sharedContent.replace(
    /      \) : \(\n        <img\n            src=\{activePosterUrl\}/,
    '      ) : (\n        <motion.img\n            layoutId={!isMobileBookletOpen ? `book-${movie.id}` : undefined}\n            src={activePosterUrl}'
  );
  sharedContent = sharedContent.replace(
    /            onClick=\{\(\) => setIsMobileBookletOpen\(true\)\}\n          \/>\n      \)\}/,
    '            onClick={() => setIsMobileBookletOpen(true)}\n          />\n      )}'
  );

  // Mobile 3D Booklet overlay
  sharedContent = sharedContent.replace(
    /          <button\n            type="button"\n            onClick=\{\(\) => setIsMobileBookletOpen\(false\)\}/,
    '          <button\n            type="button"\n            onClick={() => setIsMobileBookletOpen(false)}'
  );
  sharedContent = sharedContent.replace(
    /          <PageFlip\n            pages=\{pages as any\}\n            pageWidth=\{170\}/,
    '          <motion.div layoutId={isMobileBookletOpen ? `book-${movie.id}` : undefined} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>\n          <PageFlip\n            pages={pages as any}\n            pageWidth={170}'
  );
  sharedContent = sharedContent.replace(
    /            forceClose=\{\!isOpen\}\n          \/>\n          <div className="flex items-center gap-1.5 mt-6/,
    '            forceClose={!isOpen}\n          />\n          </motion.div>\n          <div className="flex items-center gap-1.5 mt-6'
  );
}
fs.writeFileSync('apps/web/src/components/movies/shared.tsx', sharedContent, 'utf8');

console.log("Patched shared.tsx and MovieCard.tsx");
