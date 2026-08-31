const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/component-styles.css', 'utf8');

content = content.replace(
  '  top: var(--movie-origin-top);\n  left: var(--movie-origin-left);\n  width: var(--movie-origin-width);\n  height: var(--movie-origin-height);',
  '  top: calc(var(--movie-origin-top) + (var(--movie-origin-height) / 2));\n  left: calc(var(--movie-origin-left) + (var(--movie-origin-width) / 2));\n  width: var(--movie-origin-width);\n  height: var(--movie-origin-height);'
);

content = content.replace(
  '  transform: translate(0, 0);',
  '  transform: translate(-50%, -50%);'
);

fs.writeFileSync('apps/web/src/app/component-styles.css', content, 'utf8');
console.log("Patched CSS origin");
