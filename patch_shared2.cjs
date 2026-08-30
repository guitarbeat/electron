const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');

content = content.replace(/  onClose\?:\(\) => void;\n\}/g, '  onClose?: () => void;\n  isOpen?: boolean;\n}');

content = content.replace(/  onToggleWatched,\n  onEdit,\n  onClose,\n\}\) => \{/g, '  onToggleWatched,\n  onEdit,\n  onClose,\n  isOpen = true,\n}) => {');

content = content.replace(/shadow=\{0\.4\}\n            onBackgroundClick=\{onClose\}\n            maxTurnCount=\{1\}\n          \/>/g, 'shadow={0.4}\n            onBackgroundClick={onClose}\n            maxTurnCount={1}\n            forceClose={!isOpen}\n          />');

fs.writeFileSync('apps/web/src/components/movies/shared.tsx', content, 'utf8');
console.log("Patched shared.tsx");
