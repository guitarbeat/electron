const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/ui/PageFlip.tsx', 'utf8');

content = content.replace(/      onPointerDown=\{\(e\) => e\.stopPropagation\(\)\}\n      onPointerUp=\{\(e\) => e\.stopPropagation\(\)\}\n      onTap=\{\(e, info\) => \{\n        e\.stopPropagation\(\);\n        onSelect\(index\);\n      \}\}/g, '      onClick={(e) => {\n        e.stopPropagation();\n        onSelect(index);\n      }}');

fs.writeFileSync('apps/web/src/components/ui/PageFlip.tsx', content, 'utf8');
console.log("Patched PageFlip events");
