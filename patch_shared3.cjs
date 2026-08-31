const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');

content = content.replace(/            forceClose=\{!isOpen\}\n          \/>/g, '            forceClose={!isOpen}\n            onPageChange={(p) => {\n              if (p === 0) onClose?.();\n            }}\n          />');

fs.writeFileSync('apps/web/src/components/movies/shared.tsx', content, 'utf8');
console.log("Patched shared.tsx with onPageChange");
