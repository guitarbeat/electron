#!/usr/bin/env node
/**
 * Split src/app/App.scss feature blocks into styles/_*.scss partials.
 *
 * Usage:
 *   node scripts/split-app-scss.mjs              # extract all pending sections
 *   node scripts/split-app-scss.mjs --dry-run    # print plan only
 *   node scripts/split-app-scss.mjs --verify     # extract then run pnpm build
 *   node scripts/split-app-scss.mjs --section watchlist
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const appScss = join(root, 'src/app/App.scss');
const stylesDir = join(root, 'src/app/styles');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const verify = args.has('--verify');
const onlySection = (() => {
  const i = process.argv.indexOf('--section');
  return i >= 0 ? process.argv[i + 1] : null;
})();

/** @type {{ id: string; title: string; start: RegExp; end?: RegExp }[]} */
const SECTIONS = [
  {
    id: 'watchlist',
    title: 'Movies watchlist, movie cards, top controls',
    start: /WATCHLIST STYLES/,
    end: /FLOATING MEMORIES PANEL/,
  },
  {
    id: 'memories',
    title: 'Floating memories panel and memory ledger',
    start: /FLOATING MEMORIES PANEL/,
    end: /PLACE CARDS/,
  },
  {
    id: 'places',
    title: 'Place cards, places grid, top controls, logo lab',
    start: /PLACE CARDS/,
    end: /Theme-aware shell/,
  },
  {
    id: 'theme-shell',
    title: 'Theme-aware shell overrides and workspace polish',
    start: /Theme-aware shell/,
  },
];

const EXISTING_USES = [
  'shell-layout',
  'human-textures',
  'workspace-surface',
  'globals',
  'motion',
  'spin-wheel',
  'collection-layout',
  'ui-primitives',
];

function findLineIndex(lines, pattern, from = 0) {
  for (let i = from; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i;
  }
  return -1;
}

function findSectionStart(lines, titlePattern, from = 0) {
  const titleIdx = findLineIndex(lines, titlePattern, from);
  if (titleIdx < 0) return -1;
  // Include the decorative banner comment (1-3 lines above the title).
  let start = titleIdx;
  while (start > from && /^\s*(\*|=|\/)/.test(lines[start - 1])) start--;
  while (start > from && lines[start - 1].trim() === '') start--;
  return start;
}

function planSections(lines) {
  const plans = [];
  let cursor = 0;

  for (const section of SECTIONS) {
    const start = findSectionStart(lines, section.start, cursor);
    if (start < 0) continue;

    let end = lines.length;
    if (section.end) {
      const endIdx = findSectionStart(lines, section.end, start + 1);
      if (endIdx >= 0) end = endIdx;
    }

    plans.push({ ...section, start, end, lineCount: end - start });
    cursor = end;
  }

  return plans;
}

const THEME_USES = [
  "@use '../theme/breakpoints' as *;",
  "@use '../theme/glass-effects' as *;",
  "@use '../theme/color-utils' as *;",
];

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap');";

function buildAppScss(preambleBody, sectionIds) {
  const partialUses = [...EXISTING_USES, ...sectionIds.filter((id) => !EXISTING_USES.includes(id))].map(
    (id) => `@use './styles/${id}';`,
  );

  const comment = `/*
 * App.scss — shell utilities (loading curtain, skip link, map height).
 * Feature skins: src/app/styles/_*.scss — see scripts/split-app-scss.mjs
 */`;

  return [
    ...partialUses,
    ...THEME_USES,
    FONT_IMPORT,
    '',
    comment,
    '',
    preambleBody.trim(),
    '',
  ].join('\n');
}

function extractPreambleBody(lines, firstFeatureStart) {
  const slice = lines.slice(0, firstFeatureStart);
  const startIdx = slice.findIndex((l) => l.startsWith('.places-map-card'));
  let body =
    startIdx < 0
      ? slice.filter((l) => !l.startsWith('@use ') && !l.startsWith('@import url')).join('\n')
      : slice.slice(startIdx).join('\n');
  // Drop trailing banner fragments left by imprecise section boundaries.
  body = body.replace(/\n\s*\/\* =+[\s\S]*$/, '').trimEnd();
  return body;
}

function main() {
  const raw = readFileSync(appScss, 'utf8');
  const lines = raw.split('\n');
  let plans = planSections(lines);

  if (onlySection) {
    plans = plans.filter((p) => p.id === onlySection);
    if (!plans.length) {
      console.error(`Section not found or already extracted: ${onlySection}`);
      process.exit(1);
    }
  }

  if (!plans.length) {
    console.log('No extractable sections found in App.scss.');
    return;
  }

  const firstStart = plans[0].start;
  const preambleBody = extractPreambleBody(lines, firstStart);

  console.log('Split plan:');
  for (const p of plans) {
    console.log(`  _${p.id}.scss  lines ${p.start + 1}-${p.end}  (${p.lineCount} lines)  — ${p.title}`);
  }

  if (dryRun) return;

  const extractedIds = [];
  for (const p of plans) {
    const partialPath = join(stylesDir, `_${p.id}.scss`);
    const body = lines.slice(p.start, p.end).join('\n').trim() + '\n';
    const header = `/* ${p.title} — extracted from App.scss */\n\n`;
    writeFileSync(partialPath, header + body);
    extractedIds.push(p.id);
    console.log(`Wrote ${partialPath}`);
  }

  const newApp = buildAppScss(preambleBody, extractedIds);
  writeFileSync(appScss, newApp);
  console.log(`Updated ${appScss} (${newApp.split('\n').length} lines)`);

  console.log('\nRepairing partial section banners…');
  execSync('node scripts/repair-scss-partials.mjs', { cwd: root, stdio: 'inherit' });

  if (verify) {
    console.log('\nRunning pnpm build…');
    execSync('pnpm build', { cwd: root, stdio: 'inherit' });
    console.log('Build OK');
  }
}

main();
