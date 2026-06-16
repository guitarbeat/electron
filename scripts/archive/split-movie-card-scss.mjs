#!/usr/bin/env node
/** Second-pass split of _movie-card.scss into face / details / rail partials. */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const stylesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/app/styles');
const lines = readFileSync(join(stylesDir, '_movie-card.scss'), 'utf8').split('\n');

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n').trimEnd() + '\n';
}

const files = {
  '_movie-card-face.scss': slice(5, 688),
  '_movie-details-modal.scss': slice(689, 1247),
  '_movie-card-rail.scss': slice(1249, lines.length),
  '_movie-card.scss': [
    '/* Movie card — face, details modal, in-card action rail */\n',
    "@use 'media-card' as *;",
    "@use 'movie-card-face';",
    "@use 'movie-details-modal';",
    "@use 'movie-card-rail';",
    '',
  ].join('\n'),
};

for (const [name, body] of Object.entries(files)) {
  writeFileSync(join(stylesDir, name), body);
  console.log(`${name}: ${body.split('\n').length} lines`);
}
