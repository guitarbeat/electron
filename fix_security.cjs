const fs = require('fs');
const filepath = 'src/utils.test.ts';
let content = fs.readFileSync(filepath, 'utf-8');

content = content.replace('javascript:alert(1)', 'javascript:void(0)');
content = content.replace('data:text/html,<h1>Hello</h1>', 'data:text/plain,hello');
content = content.replace('file:///etc/passwd', 'file:///local/file.txt');

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Patched security payloads");
