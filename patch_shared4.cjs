const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');

content = content.replace(/  onClose\?: \(\) => void;\n\}/g, '  onClose?: () => void;\n  isOpen?: boolean;\n}');

fs.writeFileSync('apps/web/src/components/movies/shared.tsx', content, 'utf8');
console.log("Patched shared.tsx PosterHeroProps");
