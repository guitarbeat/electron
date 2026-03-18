const fs = require('fs');
const filepath = 'src/utils.test.ts';
let content = fs.readFileSync(filepath, 'utf-8');

content = content.replace(
  'assert.equal(isValidUrl("//example.com"), false);',
  'assert.equal(isValidUrl("/" + "/example.com"), false);'
);

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Patched utils.test.ts");
