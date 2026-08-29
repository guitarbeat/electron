import fs from 'node:fs';
import path from 'node:path';

const raw = JSON.parse(fs.readFileSync('/Volumes/LoveSSD/electron/.agents/survey_explorer_css/css_analysis_raw.json', 'utf8'));

console.log('=== DEAD CLASSES IN component-styles.css ===');
console.log(raw.compAnalysis.dead);

console.log('\n=== DEAD CLASSES IN globals.css ===');
console.log(raw.globalsAnalysis.dead);
