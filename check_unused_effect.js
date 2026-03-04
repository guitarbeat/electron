import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.argv[2] ?? '.';
const EXCLUDED_DIRS = new Set(['.git', '.next', '.turbo', 'build', 'dist', 'node_modules']);
const TS_FILE_RE = /\.(ts|tsx)$/;
const USE_EFFECT_IMPORT_RE = /import\s*{[^}]*\buseEffect\b[^}]*}\s*from\s*['"]react['"]/;
const USE_EFFECT_CALL_RE = /\buseEffect\s*\(/;

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        walk(filePath, fileList);
      }
      continue;
    }

    if (entry.isFile() && TS_FILE_RE.test(entry.name)) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function stripImportLines(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('import '))
    .join('\n');
}

function findUnusedUseEffect(files) {
  const results = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    if (!USE_EFFECT_IMPORT_RE.test(content)) {
      continue;
    }

    const contentWithoutImports = stripImportLines(content);
    if (!USE_EFFECT_CALL_RE.test(contentWithoutImports)) {
      results.push(file);
    }
  }

  return results;
}

const files = walk(ROOT_DIR);
const unusedUseEffectFiles = findUnusedUseEffect(files);

if (unusedUseEffectFiles.length === 0) {
  console.log('No unused useEffect imports found.');
  process.exit(0);
}

console.log(`Possible unused useEffect imports (${unusedUseEffectFiles.length}):`);
for (const file of unusedUseEffectFiles) {
  console.log(`- ${file}`);
}
