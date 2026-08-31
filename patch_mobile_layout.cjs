const fs = require('fs');

let sharedContent = fs.readFileSync('apps/web/src/components/movies/shared.tsx', 'utf8');

// Replace the mobile img layoutId to be conditional
sharedContent = sharedContent.replace(
  /<motion\.div layoutId=\{\`book-\$\{movie\.id\}\`\} className="w-full h-full">/,
  '<motion.div layoutId={!isMobileBookletOpen ? `book-${movie.id}` : undefined} className="w-full h-full">'
);

fs.writeFileSync('apps/web/src/components/movies/shared.tsx', sharedContent, 'utf8');
console.log("Patched mobile layout ID");
