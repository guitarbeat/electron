#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAllTypeScriptFiles(dir) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath);
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

const srcDir = path.join(__dirname, 'src');
const files = getAllTypeScriptFiles(srcDir);

console.log(`🔍 Found ${files.length} TypeScript files\n`);

let convertedCount = 0;
const conversions = [];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // Pattern 1: Convert ../../ and ../ imports to @/
  // Match: from '../..../file' or from "../../../file"
  // Replace with: from '@/path/file'
  
  // The key is that all these relative imports are relative to src/
  // So ../types means @/types
  // So ../../types means @/types
  // So ../services/xyz means @/services/xyz
  
  let newContent = content;
  
  // Convert all ../ patterns - this captures paths going up from src/
  // Each ../ should map to removing one level from the import path
  newContent = newContent.replace(
    /from\s+(['"`](\.\.\/)+([^'"`]+)['"`])/g,
    (match, fullMatch, dots, remaining) => {
      // Count how many levels we're going up
      const upLevels = (dots.match(/\.\.\//g) || []).length;
      const filePath = remaining;
      
      // If we're in src/components/watchlist/index.tsx and import from ../../types
      // That's src/types, which should be @/types
      return `from '@/${filePath}`;
    }
  );
  
  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    convertedCount++;
    const relPath = path.relative(srcDir, filePath);
    conversions.push(relPath);
  }
}

console.log(`✅ Conversion complete!\n`);
conversions.forEach(f => console.log(`  ✓ ${f}`));
console.log(`\n📊 Summary: Converted ${convertedCount} files to use @/ aliases`);
