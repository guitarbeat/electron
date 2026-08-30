const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('apps/web/src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    // find useEffect with no dependency array
    // naive check: useEffect(() => { ... })
    // look for useEffect that does NOT end with , [some deps]) or ,[]) before the closing parenthesis.
    // this is tricky with regex. Let's just find all useEffects and print them.
    const regex = /useEffect\([^]*?\)(?=\s*;|\s*$)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!match[0].includes('],') && !match[0].match(/\]\s*\)$/)) {
        console.log(`Missing deps in: ${filePath}`);
        // console.log(match[0]);
      }
    }
  }
});
