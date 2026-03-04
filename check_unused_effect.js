const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        walk(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = walk('.');

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  // Check if useEffect is imported from react
  if (content.match(/import\s+.*useEffect.*from\s+['"]react['"]/)) {
    // Naive check: remove import lines and check for usage
    const lines = content.split('\n');
    let usageCount = 0;
    for (const line of lines) {
      if (!line.trim().startsWith('import') && line.includes('useEffect')) {
        usageCount++;
      }
    }
    if (usageCount === 0) {
      console.log(`Possible unused useEffect in ${file}`);
    }
  }
});
