import fs from 'node:fs';
import path from 'node:path';

const projectRoot = '/Volumes/LoveSSD/electron';
const webSrc = path.join(projectRoot, 'apps/web/src');

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

// Function to find references for a class name
function findClassReferences(className) {
  const matches = [];
  // Direct regex match as whole word
  const wordRegex = new RegExp(`\\b${className}\\b`);
  
  for (const s of sourceContents) {
    if (s.rel.endsWith('.css')) continue;
    if (wordRegex.test(s.content)) {
      // Find line numbers
      const lines = s.content.split('\n');
      const matchingLines = [];
      lines.forEach((l, idx) => {
        if (wordRegex.test(l)) {
          matchingLines.push({ line: idx + 1, text: l.trim() });
        }
      });
      matches.push({ file: s.rel, occurrences: matchingLines });
    }
  }
  return matches;
}

// Parse CSS file into rules with line numbers and selector
function parseCssRules(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const rules = [];
  let currentSelector = [];
  let inRule = false;
  let startLine = 0;
  let braceDepth = 0;
  let currentComment = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inRule) {
      if (trimmed.startsWith('/*')) {
        currentComment = trimmed;
      }
      if (trimmed.includes('{')) {
        inRule = true;
        startLine = i + 1;
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        const selectorPart = line.split('{')[0].trim();
        if (selectorPart) currentSelector.push(selectorPart);
        if (braceDepth === 0) {
          rules.push({
            selector: currentSelector.join(' ').replace(/\s+/g, ' ').trim(),
            startLine,
            endLine: i + 1,
            comment: currentComment
          });
          currentSelector = [];
          inRule = false;
          currentComment = '';
        }
      } else if (trimmed && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
        currentSelector.push(trimmed);
      }
    } else {
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
      if (braceDepth <= 0) {
        rules.push({
          selector: currentSelector.join(' ').replace(/\s+/g, ' ').trim(),
          startLine,
          endLine: i + 1,
          comment: currentComment
        });
        currentSelector = [];
        inRule = false;
        braceDepth = 0;
        currentComment = '';
      }
    }
  }
  return rules;
}

const compRules = parseCssRules(path.join(webSrc, 'app/component-styles.css'));
const globalsRules = parseCssRules(path.join(webSrc, 'app/globals.css'));

// Extract classes from selector
function extractClasses(selector) {
  const clean = selector.replace(/:[a-zA-Z0-9_-]+(\([^)]*\))?/g, '').replace(/\[[^\]]*\]/g, '');
  const matches = clean.match(/\.([a-zA-Z0-9_-]+)/g) || [];
  return [...new Set(matches.map(m => m.slice(1)))];
}

function auditRules(rules) {
  return rules.map(r => {
    const classes = extractClasses(r.selector);
    const classUsages = {};
    for (const c of classes) {
      classUsages[c] = findClassReferences(c);
    }
    const isAtRule = r.selector.startsWith('@');
    const isElementOnly = classes.length === 0;
    
    // A rule is dead if it targets classes and ALL or critical target classes have 0 references in TSX
    // For single class: matches === 0
    // For compound selector: if the terminal/leaf class is not in TSX, it can't match anything
    const deadClasses = classes.filter(c => classUsages[c].length === 0);
    const activeClasses = classes.filter(c => classUsages[c].length > 0);
    
    return {
      ...r,
      classes,
      deadClasses,
      activeClasses,
      classUsages,
      isAtRule,
      isElementOnly
    };
  });
}

const compAudited = auditRules(compRules);
const globalsAudited = auditRules(globalsRules);

fs.writeFileSync(
  path.join(projectRoot, '.agents/survey_explorer_css/detailed_audit.json'),
  JSON.stringify({ compAudited, globalsAudited }, null, 2)
);

console.log('Done detailed audit. JSON written.');
