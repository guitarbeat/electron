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
    
    // Simple check: Look for array/object literals assigned to const/let/var 
    // and then used in useEffect deps.
    // Actually, just let's look for useEffect dependency arrays that contain variables not from props/hooks/memo
    // This is hard to do statically without an AST.
  }
});
