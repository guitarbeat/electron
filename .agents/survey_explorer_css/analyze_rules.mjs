import fs from 'node:fs';
import path from 'node:path';

const projectRoot = '/Volumes/LoveSSD/electron';
const webSrc = path.join(projectRoot, 'apps/web/src');
const compStylesPath = path.join(webSrc, 'app/component-styles.css');

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

const css = fs.readFileSync(compStylesPath, 'utf8');
const lines = css.split('\n');

// Parse rules: find selector lines and block spans
const rules = [];
let currentSelector = [];
let inRule = false;
let startLine = 0;
let braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // skip pure comments outside rules
  if (!inRule && (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.endsWith('*/') || trimmed === '')) {
    continue;
  }
  
  if (!inRule) {
    if (trimmed.includes('{')) {
      inRule = true;
      startLine = i + 1;
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
      currentSelector.push(line.split('{')[0].trim());
      if (braceDepth === 0) {
        // one line rule
        rules.push({
          selector: currentSelector.join(' '),
          startLine,
          endLine: i + 1
        });
        currentSelector = [];
        inRule = false;
      }
    } else {
      currentSelector.push(trimmed);
    }
  } else {
    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;
    if (braceDepth <= 0) {
      rules.push({
        selector: currentSelector.join(' '),
        startLine,
        endLine: i + 1
      });
      currentSelector = [];
      inRule = false;
      braceDepth = 0;
    }
  }
}

console.log(`Parsed ${rules.length} CSS rule blocks.`);

// Extract all class names from each rule selector
function getClassesFromSelector(sel) {
  // remove pseudo elements, pseudo classes, attribute selectors
  const cleaned = sel.replace(/:[a-zA-Z0-9_-]+(\([^)]*\))?/g, '').replace(/\[[^\]]*\]/g, '');
  const matches = cleaned.match(/\.([a-zA-Z0-9_-]+)/g) || [];
  return matches.map(m => m.slice(1));
}

const ruleAnalysis = rules.map(r => {
  const classes = getClassesFromSelector(r.selector);
  const classMatches = {};
  let anyClassUsed = false;
  let allAnywhere = false;
  
  for (const cls of classes) {
    const regex = new RegExp(`\\b${cls}\\b`);
    const hits = sourceContents.filter(s => regex.test(s.content)).map(s => s.rel);
    classMatches[cls] = hits;
    if (hits.length > 0) anyClassUsed = true;
  }
  
  return {
    ...r,
    classes,
    classMatches,
    isUsed: classes.length === 0 ? true : anyClassUsed // e.g. keyframes or element selectors
  };
});

const usedRules = ruleAnalysis.filter(r => r.isUsed);
const unusedRules = ruleAnalysis.filter(r => !r.isUsed);

console.log(`Used / partially used rules: ${usedRules.length}`);
console.log(`Completely unused rules: ${unusedRules.length}`);

fs.writeFileSync(
  path.join(projectRoot, '.agents/survey_explorer_css/rules_analysis.json'),
  JSON.stringify({ usedRules, unusedRules }, null, 2)
);
