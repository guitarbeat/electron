const fs = require('fs');
let content = fs.readFileSync('src/components/ui/Skeleton.tsx', 'utf8');

content = content.replace(/import { colors, radius, spacing, shadows } from '@\/theme\/tokens';\n/g, "import { radius } from '@/theme/tokens';\n");

fs.writeFileSync('src/components/ui/Skeleton.tsx', content);
