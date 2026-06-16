#!/usr/bin/env node
/**
 * Fix truncated section banners left by an imprecise App.scss split.
 * Strips trailing incomplete `/* =...` lines and restores section headers.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const stylesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/app/styles');

const REPAIRS = [
  {
    file: '_watchlist.scss',
    stripTrailingBanner: true,
    headerAfter: `/* Movies watchlist, movie cards, top controls — extracted from App.scss */

/* ============================================================
   WATCHLIST STYLES
   (merged from src/components/movies/Watchlist.css)
   ============================================================ */
`,
    bodyStart: '/* Consolidated Watchlist Styles */',
  },
  {
    file: '_memories.scss',
    stripTrailingBanner: true,
    headerAfter: `/* Floating memories panel and memory ledger — extracted from App.scss */

/* ============================================================
   FLOATING MEMORIES PANEL STYLES
   (merged from src/components/memories/FloatingMemoriesPanel.css)
   ============================================================ */
`,
    bodyStart: '.memory-lane',
  },
  {
    file: '_places.scss',
    stripTrailingBanner: true,
    headerAfter: `/* Place cards, places grid, top controls, logo lab — extracted from App.scss */

/* ═══════════════════════════════════════════════════════════════════════════
   PLACE CARDS  —  poster-style cards parallel to MovieCard
   ═══════════════════════════════════════════════════════════════════════════ */
`,
    bodyStart: '.places-grid',
  },
  {
    file: '_theme-shell.scss',
    headerAfter: `/* Theme-aware shell overrides and workspace polish — extracted from App.scss */

/* ============================================================================
   Theme-aware shell (palette from themes.ts via applyTheme)
   ============================================================================ */
`,
    bodyStart: "body[data-theme='movies']",
  },
];

function stripTrailingBanner(text) {
  return text.replace(/\n\s*\/\*[=\s═─-]*\s*$/u, '').trimEnd() + '\n';
}

for (const repair of REPAIRS) {
  const path = join(stylesDir, repair.file);
  let text = readFileSync(path, 'utf8');

  if (repair.stripTrailingBanner) {
    text = stripTrailingBanner(text);
  }

  if (repair.headerAfter) {
    const bodyIdx = text.indexOf(repair.bodyStart);
    if (bodyIdx < 0) {
      console.error(`${repair.file}: body start not found (${repair.bodyStart})`);
      process.exit(1);
    }
    text = repair.headerAfter + '\n' + text.slice(bodyIdx);
  }

  writeFileSync(path, text);
  console.log(`Repaired ${repair.file}`);
}
