import fs from 'node:fs';
import path from 'node:path';

const projectRoot = '/Volumes/LoveSSD/electron';
const webSrc = path.join(projectRoot, 'apps/web/src');
const compStylesPath = path.join(webSrc, 'app/component-styles.css');
const globalsStylesPath = path.join(webSrc, 'app/globals.css');

// 1. Gather all tsx / ts / html files in apps/web/src
function getFiles(dir, exts = ['.tsx', '.ts', '.html']) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

const sourceFiles = getFiles(webSrc);
const sourceContents = sourceFiles.map(f => ({
  file: f,
  rel: path.relative(projectRoot, f),
  content: fs.readFileSync(f, 'utf8')
}));

// Helper to extract top-level and nested CSS class selectors
function extractClassSelectors(cssContent) {
  // Remove comments
  const noComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
  // Match class names: .([a-zA-Z0-9_-]+)
  // But exclude pseudo-classes, numbers, etc.
  const regex = /\.([a-zA-Z0-9_-]+)(?=[^a-zA-Z0-9_-]|$)/g;
  const classes = new Set();
  let match;
  while ((match = regex.exec(noComments)) !== null) {
    const cls = match[1];
    // Filter out obvious non-classes or pure numbers/keyframes
    if (!/^\d/.test(cls)) {
      classes.add(cls);
    }
  }
  return Array.from(classes);
}

const compStylesContent = fs.readFileSync(compStylesPath, 'utf8');
const compClasses = extractClassSelectors(compStylesContent);

const globalsContent = fs.readFileSync(globalsStylesPath, 'utf8');
const globalsClasses = extractClassSelectors(globalsContent);

function analyzeClasses(classList, cssName) {
  const active = [];
  const dead = [];

  for (const cls of classList) {
    // Check if cls appears in any source file
    // We should check exact word boundary or string occurrence
    const regex = new RegExp(`\\b${cls}\\b`);
    const matchingFiles = [];
    for (const sf of sourceContents) {
      // Don't search inside CSS files themselves
      if (sf.rel.endsWith('.css')) continue;
      if (regex.test(sf.content)) {
        matchingFiles.push(sf.rel);
      }
    }
    if (matchingFiles.length > 0) {
      active.push({ class: cls, files: matchingFiles });
    } else {
      dead.push(cls);
    }
  }
  return { active, dead };
}

const compAnalysis = analyzeClasses(compClasses, 'component-styles.css');
const globalsAnalysis = analyzeClasses(globalsClasses, 'globals.css');

console.log(`=== component-styles.css ===`);
console.log(`Total unique classes: ${compClasses.length}`);
console.log(`Active classes: ${compAnalysis.active.length}`);
console.log(`Dead / Orphaned classes: ${compAnalysis.dead.length}`);

console.log(`\n=== globals.css ===`);
console.log(`Total unique classes: ${globalsClasses.length}`);
console.log(`Active classes: ${globalsAnalysis.active.length}`);
console.log(`Dead / Orphaned classes: ${globalsAnalysis.dead.length}`);

fs.writeFileSync(
  path.join(projectRoot, '.agents/survey_explorer_css/css_analysis_raw.json'),
  JSON.stringify({ compAnalysis, globalsAnalysis }, null, 2)
);
