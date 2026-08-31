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
    
    for(let i=0; i<lines.length; i++) {
        if(lines[i].includes('useEffect(')) {
            let block = "";
            let j = i;
            let open = 0;
            let started = false;
            while (j < lines.length) {
              block += lines[j] + " ";
              for(let char of lines[j]) {
                if (char === '(') { open++; started = true; }
                if (char === ')') open--;
              }
              if (started && open === 0) break;
              j++;
            }
            // extract the last argument
            const match = block.match(/,\s*(\[.*?\])\s*\)$/);
            if (match) {
              // console.log(`${filePath}:${i+1} => ${match[1]}`);
            } else {
              console.log(`SUSPICIOUS ${filePath}:${i+1} => ${block.substring(block.length - 30)}`);
            }
        }
    }
  }
});
