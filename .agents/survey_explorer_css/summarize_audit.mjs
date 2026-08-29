import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('/Volumes/LoveSSD/electron/.agents/survey_explorer_css/detailed_audit.json', 'utf8'));

console.log('=== COMPONENT-STYLES.CSS AUDIT SUMMARY ===');
console.log('Total rules parsed:', data.compAudited.length);

const compRulesWithDeadLeaf = [];
const compFullyDeadRules = [];
const compPartiallyDeadRules = [];
const compActiveRules = [];

for (const rule of data.compAudited) {
  if (rule.isAtRule && rule.classes.length === 0) continue;
  if (rule.classes.length === 0) continue;

  if (rule.deadClasses.length === rule.classes.length) {
    compFullyDeadRules.push(rule);
  } else if (rule.deadClasses.length > 0) {
    compPartiallyDeadRules.push(rule);
  } else {
    compActiveRules.push(rule);
  }
}

console.log('Fully dead rules (all classes absent in TSX):', compFullyDeadRules.length);
console.log('Partially dead rules (some classes absent in TSX):', compPartiallyDeadRules.length);
console.log('Fully active rules (all classes present in TSX):', compActiveRules.length);

console.log('\n--- FULLY DEAD RULES IN component-styles.css ---');
compFullyDeadRules.forEach(r => {
  console.log(`L${r.startLine}-${r.endLine}: ${r.selector} [Dead classes: ${r.deadClasses.join(', ')}]`);
});

console.log('\n--- PARTIALLY DEAD RULES IN component-styles.css ---');
compPartiallyDeadRules.forEach(r => {
  console.log(`L${r.startLine}-${r.endLine}: ${r.selector} [Dead: ${r.deadClasses.join(', ')} | Active: ${r.activeClasses.join(', ')}]`);
});

console.log('\n=== GLOBALS.CSS AUDIT SUMMARY ===');
console.log('Total rules parsed:', data.globalsAudited.length);

const globFullyDead = [];
const globPartiallyDead = [];
const globActive = [];

for (const rule of data.globalsAudited) {
  if (rule.isAtRule && rule.classes.length === 0) continue;
  if (rule.classes.length === 0) continue;

  if (rule.deadClasses.length === rule.classes.length) {
    globFullyDead.push(rule);
  } else if (rule.deadClasses.length > 0) {
    globPartiallyDead.push(rule);
  } else {
    globActive.push(rule);
  }
}

console.log('Fully dead rules in globals.css:', globFullyDead.length);
console.log('Partially dead rules in globals.css:', globPartiallyDead.length);
console.log('Fully active rules in globals.css:', globActive.length);

console.log('\n--- FULLY DEAD RULES IN globals.css ---');
globFullyDead.forEach(r => {
  console.log(`L${r.startLine}-${r.endLine}: ${r.selector} [Dead classes: ${r.deadClasses.join(', ')}]`);
});
