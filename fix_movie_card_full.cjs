const fs = require('fs');
let content = fs.readFileSync('src/components/movies/MovieCard.tsx', 'utf8');

content = content.replace(/MediaCardSuccessBadge(,\n\s*|\n\s*|(?=}))/g, '');

fs.writeFileSync('src/components/movies/MovieCard.tsx', content);
