#!/usr/bin/env node
/**
 * Find CSS class selectors in SCSS that never appear in TSX/TS/HTML under src/.
 * Fast heuristic for dead-style cleanup candidates (not proof — check manually).
 *
 * Usage:
 *   node scripts/prune-dead-scss.mjs
 *   node scripts/prune-dead-scss.mjs --file src/app/styles/_watchlist.scss
 *   node scripts/prune-dead-scss.mjs --min-lines 5
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const root = join(import.meta.dirname, '..');
const srcRoot = join(root, 'src');
const defaultScss = join(root, 'src/app/App.scss');

const args = process.argv.slice(2);
const fileArg = (() => {
  const i = args.indexOf('--file');
  return i >= 0 ? join(root, args[i + 1]) : defaultScss;
})();
const minLines = (() => {
  const i = args.indexOf('--min-lines');
  return i >= 0 ? Number(args[i + 1]) : 3;
})();

function collectScssFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      out.push(...collectScssFiles(p));
    } else if (name.endsWith('.scss') || name.endsWith('.css')) {
      out.push(p);
    }
  }
  return out;
}

function extractClasses(scss) {
  const classes = new Set();
  const re = /\.([a-zA-Z_][\w-]*)/g;
  let m;
  while ((m = re.exec(scss))) {
    const c = m[1];
    if (c === 'scss' || c === 'css') continue;
    classes.add(c);
  }
  return classes;
}

function classUsedInSrc(className) {
  try {
    execSync(`rg -l --glob '*.{tsx,ts,html}' -F '${className}' src`, {
      cwd: root,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function blockLineCount(scss, className) {
  const marker = `.${className}`;
  const idx = scss.indexOf(marker);
  if (idx < 0) return 0;

  const braceStart = scss.indexOf('{', idx);
  if (braceStart < 0) return 1;

  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < scss.length; i++) {
    if (scss[i] === '{') depth++;
    else if (scss[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  return scss.slice(idx, end + 1).split('\n').length;
}

const files = statSync(fileArg).isDirectory()
  ? collectScssFiles(fileArg)
  : [fileArg];

let scss = '';
for (const f of files) scss += readFileSync(f, 'utf8') + '\n';

const classes = [...extractClasses(scss)].sort();
const dead = [];

for (const c of classes) {
  if (classUsedInSrc(c)) continue;
  const lines = blockLineCount(scss, c);
  if (lines >= minLines) dead.push({ class: c, lines });
}

dead.sort((a, b) => b.lines - a.lines);

console.log(`Scanned ${files.length} file(s), ${classes.length} unique classes`);
console.log(`Dead candidates (≥${minLines} lines, not in src tsx/ts/html):\n`);

if (!dead.length) {
  console.log('  (none)');
} else {
  for (const { class: c, lines } of dead.slice(0, 40)) {
    console.log(`  .${c}  (~${lines} lines)`);
  }
  if (dead.length > 40) console.log(`  … and ${dead.length - 40} more`);
}
