const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', 'utf8');

content = content.replace(
  '      const frame = window.requestAnimationFrame(() => {\n        setIsEntering(true);\n      });\n      return () => window.cancelAnimationFrame(frame);',
  '      let frame2;\n      const frame = window.requestAnimationFrame(() => {\n        frame2 = window.requestAnimationFrame(() => {\n          setIsEntering(true);\n        });\n      });\n      return () => {\n        window.cancelAnimationFrame(frame);\n        if (frame2) window.cancelAnimationFrame(frame2);\n      };'
);

fs.writeFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', content, 'utf8');
console.log("Patched RAF");
