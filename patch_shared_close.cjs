const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');

// Replace both occurrences of the specific PageFlip props
content = content.replace(/            forceClose=\{!isOpen\}\n            autoOpen=\{isOpen\}\n            onPageChange=\{\(p\) => \{\n              if \(p === 0\) onClose\?\.\(\);\n            \}\}\n          \/>/g, '            forceClose={!isOpen}\n          />');

fs.writeFileSync('apps/web/src/components/movies/shared.tsx', content, 'utf8');
console.log("Patched shared.tsx");
