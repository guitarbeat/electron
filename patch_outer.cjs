const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', 'utf8');

content = content.replace(
  /      role="dialog"\n      aria-modal="true"\n      aria-labelledby="movie-details-title"\n    >/g,
  '      role="dialog"\n      aria-modal="true"\n      aria-labelledby="movie-details-title"\n      onClick={(e) => {\n        if (e.target === e.currentTarget) close();\n      }}\n    >'
);

fs.writeFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', content, 'utf8');
console.log("Patched outer modal div");
