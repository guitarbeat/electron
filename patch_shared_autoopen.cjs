const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');

content = content.replace(/            forceClose=\{!isOpen\}\n            onPageChange/g, '            forceClose={!isOpen}\n            autoOpen={isOpen}\n            onPageChange');

content = content.replace(/            maxTurnCount=\{1\}\n          \/>\n          <div className="flex items-center gap-1\.5/g, '            maxTurnCount={1}\n            forceClose={!isOpen}\n            autoOpen={isOpen}\n            onPageChange={(p) => {\n              if (p === 0) onClose?.();\n            }}\n          />\n          <div className="flex items-center gap-1.5');

fs.writeFileSync('apps/web/src/components/movies/shared.tsx', content, 'utf8');
console.log("Patched shared.tsx autoOpen");
