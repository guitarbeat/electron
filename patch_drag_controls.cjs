const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', 'utf8');

// replace motion import
content = content.replace(
  'import { motion } from "motion/react";',
  'import { motion, useDragControls } from "motion/react";'
);

// inside component: add useDragControls
content = content.replace(
  '  const { dialogRef, closeButtonRef, playPop, close } = useModalBase(',
  '  const dragControls = useDragControls();\n  const { dialogRef, closeButtonRef, playPop, close } = useModalBase('
);

// modify motion.div and handle
const oldMotion = `        <motion.div 
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
const newMotion = `        <motion.div 
          className="movie-details-modal__surface"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          drag={isMobile ? "y" : false}
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.4}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              close();
            }
          }}
        >
          {isMobile && (
            <div 
              className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center z-50 touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1.5 bg-white/30 rounded-full" />
            </div>
          )}`;
content = content.replace(oldMotion, newMotion);

fs.writeFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', content, 'utf8');
console.log("Patched MovieDetailsModal drag controls");
