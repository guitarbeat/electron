const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', 'utf8');

content = content.replace(/closeTimeoutRef\.current = window\.setTimeout\(\(\) => \{\n      setIsVisible\(false\);\n    \}, 260\);/g, 'closeTimeoutRef.current = window.setTimeout(() => {\n      setIsVisible(false);\n    }, 550);');

fs.writeFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', content, 'utf8');
console.log("Patched MovieDetailsModal.tsx timeout");
