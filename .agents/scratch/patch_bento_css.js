const fs = require('fs');
const path = 'artifacts/electron/src/components/ui/BentoWorkspaceController.css';
let content = fs.readFileSync(path, 'utf8');

// remove .bento-sort-chip blocks since we use MagicToggle now
content = content.replace(/\/\* ── Sort Chips [\s\S]*?\/\* ── Mobile ──/m, '/* ── Mobile ──');
content = content.replace(/\.theme-y2k \.bento-sort-chip[\s\S]*$/m, '');

fs.writeFileSync(path, content);
