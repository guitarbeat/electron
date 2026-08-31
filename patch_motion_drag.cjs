const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', 'utf8');

const oldMotion = `          dragElastic={0.4}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              close();
            }
          }}`;
const newMotion = `          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(e, info) => {
            if (info.offset.y > 120 || info.velocity.y > 400) {
              close();
            }
          }}`;
content = content.replace(oldMotion, newMotion);

fs.writeFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', content, 'utf8');
console.log("Patched motion drag");
