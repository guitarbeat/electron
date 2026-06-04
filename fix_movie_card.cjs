const fs = require('fs');
let content = fs.readFileSync('src/components/movies/MovieCard.tsx', 'utf8');

content = content.replace(/MediaCardInfo,\n\s+/g, '');
content = content.replace(/MediaCardOverlay,\n\s+/g, '');
content = content.replace(/MediaCardSuccessBadge,\n\s+/g, '');
content = content.replace(/import Button from '@\/ui\/Button';\n/g, '');
content = content.replace(/import { colors } from '@\/theme\/tokens';\n/g, '');
content = content.replace(/import MediaCardMetadata from '@\/ui\/MediaCardMetadata';\n/g, '');

fs.writeFileSync('src/components/movies/MovieCard.tsx', content);
