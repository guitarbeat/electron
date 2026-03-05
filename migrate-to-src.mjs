#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rootDirs = [
  'components',
  'hooks',
  'services',
  'context',
  'utils',
  'config',
  'design-system',
  'styles',
  'verification',
  'integrations'
];

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log('🚀 Starting migration to src/ directory structure...\n');

let count = 0;
rootDirs.forEach(dir => {
  const srcPath = path.join(__dirname, dir);
  const destPath = path.join(__dirname, 'src', dir);
  
  if (fs.existsSync(srcPath)) {
    console.log(`📦 Copying ${dir}/ to src/${dir}/...`);
    copyDirRecursive(srcPath, destPath);
    console.log(`✓ Copied ${dir}/\n`);
    count++;
  }
});

console.log(`\n✅ Migration complete! Copied ${count} directories to src/`);
console.log('📝 Next: You can now delete the original root-level directories if desired');
