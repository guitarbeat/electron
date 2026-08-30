const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/component-styles.css', 'utf8');
content = content.replace(
  '  background: hsl(\n    calc(216 + var(--loading-tone) * 5)\n    calc(22% + var(--loading-tone) * 2%)\n    calc(11% + var(--loading-tone) * 1.4%)\n  );',
  '  background: hsl(\n    calc(216 + var(--loading-tone) * 5),\n    calc(22% + var(--loading-tone) * 2%),\n    calc(11% + var(--loading-tone) * 1.4%)\n  );'
);
fs.writeFileSync('apps/web/src/app/component-styles.css', content, 'utf8');
console.log("Patched skeleton background");
