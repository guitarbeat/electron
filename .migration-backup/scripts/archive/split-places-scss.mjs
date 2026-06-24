#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/app/styles');
const lines = readFileSync(join(dir, '_places.scss'), 'utf8').split('\n');

function slice(a, b) {
  return lines.slice(a - 1, b).join('\n').trimEnd() + '\n';
}

const files = {
  '_place-card.scss': slice(16, 350),
  '_places-chrome.scss': slice(351, 681),
  '_electron-logo-lab.scss': [
    '/* Electron Logo Lab — dev tooling surface */\n',
    slice(682, lines.length),
  ].join('\n'),
  '_places.scss': [
    '/* Places feature — cards, layout, logo lab */\n',
    "@use '../../theme/breakpoints' as *;",
    "@use 'place-card';",
    "@use 'places-chrome';",
    "@use 'electron-logo-lab';",
    '',
    '.places-map-card--height {',
    '  height: 340px;',
    '}',
    '',
    "@include breakpoint-down('lg') {",
    '  .places-map-card--height {',
    '    height: min(38vh, 260px);',
    '    min-height: 200px;',
    '  }',
    '}',
    '',
  ].join('\n'),
};

for (const [name, body] of Object.entries(files)) {
  writeFileSync(join(dir, name), body);
  console.log(`${name}: ${body.split('\n').length} lines`);
}
