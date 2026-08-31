const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', 'utf8');

// add import
content = content.replace(
  'import { createPortal } from "react-dom";',
  'import { createPortal } from "react-dom";\nimport { motion } from "motion/react";'
);

// replace surface div with motion.div
const oldSurface = `        <div 
          className="movie-details-modal__surface"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >`;
const newSurface = `        <motion.div 
          className="movie-details-modal__surface"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.4}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              close();
            }
          }}
        >
          {isMobile && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-white/20 rounded-full z-50 pointer-events-none" />
          )}`;
content = content.replace(oldSurface, newSurface);
content = content.replace(
  `            </div>\n          )}\n        </div>`,
  `            </div>\n          )}\n        </motion.div>`
);

fs.writeFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', content, 'utf8');
console.log("Patched MovieDetailsModal for drag");
