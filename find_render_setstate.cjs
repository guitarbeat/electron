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
    const lines = content.split('\n');
    let insideComponent = false;
    let brackets = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/(const|function) [A-Z][a-zA-Z0-9]*\s*=?\s*\(.*=>/)) {
        insideComponent = true;
      }
      
      // Look for setSomething(
      if (line.match(/\bset[A-Z][a-zA-Z0-9]*\(/)) {
         // naive check if it's indented and not in a useEffect/callback
         if (!line.includes('useEffect') && !line.includes('useCallback') && !line.includes('=>') && !line.includes('onClick') && !line.includes('function')) {
             // console.log(`Potential direct setState at ${filePath}:${i+1}: ${line.trim()}`);
         }
      }
    }
  }
});
