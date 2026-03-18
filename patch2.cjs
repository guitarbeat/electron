const fs = require('fs');
const file = 'src/utils.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\/\/ @ts-expect-error Testing invalid runtime input\n/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched utils.test.ts!');
