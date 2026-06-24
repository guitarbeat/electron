#!/usr/bin/env node
/** One-time split of _watchlist.scss into focused partials. Safe to archive after run. */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const stylesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/app/styles');
const src = readFileSync(join(stylesDir, '_watchlist.scss'), 'utf8').split('\n');

function slice(start, end) {
  return src.slice(start - 1, end).join('\n').trimEnd() + '\n';
}

const files = {
  '_watchlist-layout.scss': [
    slice(1, 47),
    slice(102, 123),
    slice(837, 931),
  ].join('\n'),
  '_top-controls-search.scss': [
    '/* Shared search / top-controls — watchlist + places */\n',
    slice(48, 100),
    slice(125, 757),
    slice(932, 942),
  ].join('\n'),
  '_watchlist-suggestions.scss': slice(758, 836),
  '_media-card.scss': slice(944, 1089),
  '_movie-card.scss': [
    '/* Movie card — extends shared media-card base */\n',
    "@use 'media-card' as *;\n",
    slice(1090, 2477),
    slice(2479, 2732),
  ].join('\n'),
  '_watchlist.scss': [
    '/* Watchlist feature styles — layout, controls, suggestions, movie cards */\n',
    "@forward 'top-controls-search';",
    "@forward 'watchlist-layout';",
    "@forward 'watchlist-suggestions';",
    "@forward 'movie-card';",
    '',
  ].join('\n'),
};

for (const [name, body] of Object.entries(files)) {
  writeFileSync(join(stylesDir, name), body);
  console.log(`Wrote ${name} (${body.split('\n').length} lines)`);
}
