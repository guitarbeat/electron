#!/usr/bin/env node
/** Split _movie-card.scss and _workspace-skin.scss into focused partials. */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const stylesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/app/styles');

function read(name) {
  return readFileSync(join(stylesDir, name), 'utf8').split('\n');
}

function slice(lines, start, end) {
  return lines.slice(start - 1, end).join('\n').trimEnd() + '\n';
}

// ── movie-card split ────────────────────────────────────────────────────────
const movie = read('_movie-card.scss');

write('_movie-card.scss', [
  '/* Movie card poster, overlay, badges — extends media-card */\n',
  "@use 'media-card' as *;\n",
  slice(movie, 5, 1387),
].join('\n'));

write('_workspace-card-actions.scss', [
  '/* Shared card action rails — movies + places */\n',
  slice(movie, 1394, movie.length),
].join('\n'));

// Move gentle-float keyframe to watchlist-layout (only consumer)
const layoutPath = join(stylesDir, '_watchlist-layout.scss');
const layout = readFileSync(layoutPath, 'utf8');
if (!layout.includes('@keyframes gentle-float')) {
  writeFileSync(
    layoutPath,
    layout.trimEnd() +
      '\n\n@keyframes gentle-float {\n' +
      '  0%, 100% { transform: translateY(0) rotate(-2deg); }\n' +
      '  50%       { transform: translateY(-6px) rotate(2deg); }\n' +
      '}\n',
  );
}

// ── workspace-skin split ────────────────────────────────────────────────────
const skin = read('_workspace-skin.scss');

const skinPartials = {
  '_workspace-mobile.scss': slice(skin, 6, 150),
  '_workspace-suggestions.scss': slice(skin, 151, 253),
  '_workspace-movies-shell.scss': slice(skin, 254, 511),
  '_workspace-surfaces.scss': slice(skin, 512, 901),
  '_workspace-card-tilt.scss': slice(skin, 902, 977),
  '_workspace-materials.scss': slice(skin, 978, 1177),
  '_workspace-mobile-polish.scss': slice(skin, 1178, skin.length),
};

for (const [name, body] of Object.entries(skinPartials)) {
  write(name, body);
}

write('_workspace-skin.scss', [
  '/* Workspace cohesion layer — loaded via app-skin.scss */\n',
  "@use 'workspace-mobile';",
  "@use 'workspace-suggestions';",
  "@use 'workspace-movies-shell';",
  "@use 'workspace-surfaces';",
  "@use 'workspace-card-tilt';",
  "@use 'workspace-materials';",
  "@use 'workspace-mobile-polish';",
  '',
].join('\n'));

function write(name, body) {
  writeFileSync(join(stylesDir, name), body);
  console.log(`${name}: ${body.split('\n').length} lines`);
}

console.log('Done.');
