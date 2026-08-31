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
    let inEffect = false;
    let effectStart = 0;
    
    // just looking for text 'useEffect('
    for(let i=0; i<lines.length; i++) {
        if(lines[i].includes('useEffect(')) {
            // grab the next few lines
            const block = lines.slice(i, i+30).join('\n');
            if (!block.includes('],') && !block.match(/\]\s*\)\s*;/)) {
                console.log(`Possible missing deps in: ${filePath}:${i+1}`);
            }
        }
    }
  }
});
