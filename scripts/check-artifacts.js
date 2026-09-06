#!/usr/bin/env node

/**
 * Mechanical Enforcement Gate: Repository Artifact Compliance & Lifecycle Checker
 *
 * Scans the repository for orphaned, loose, or non-compliant files based on the
 * four lifecycle states defined in docs/operations/ARTIFACT_LIFECYCLE.md:
 *   1. Active (Production code, live documentation, approved configs)
 *   2. Ephemeral / Scratchpad (Debug scripts, local test outputs - must be gitignored)
 *   3. Archived (Historical patches, past personas - quarantined in maintenance/ or history/)
 *   4. Deprecated (Stale/abandoned experiments - must be deleted)
 *
 * Exits with status code 1 if any non-compliant artifact is discovered, failing CI
 * and pre-commit checks.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const violations = [];

// ============================================================================
// 1. Root Boundary & Orphaned Root Artifacts
// ============================================================================

const ALLOWED_ROOT_DIRECTORIES = new Set([
  '.agents',
  '.git',
  '.github',
  '.jules',
  '.vercel',
  'agent',
  'api',
  'apps',
  'assets',
  'dist',
  'docs',
  'e2e-tests',
  'lib',
  'node_modules',
  'scripts',
  'src',
]);

const ALLOWED_ROOT_FILES = new Set([
  '.editorconfig',
  '.env.example',
  '.gitignore',
  '.npmrc',
  '.pnpmrc',
  '.vercelignore',
  'AGENTS.md',
  'CHANGELOG.md',
  'GEMINI.md',
  'LICENSE',
  'README.md',
  'bun.lock',
  'bun.lockb',
  'eslint.config.js',
  'eslint.config.mjs',
  'metadata.json',
  'package-lock.json',
  'package.json',
  'playwright-dyad.config.ts',
  'playwright.config.ts',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'skills-lock.json',
  'tsconfig.base.json',
  'tsconfig.json',
  'vercel.json',
  'yarn.lock',
]);

const FORBIDDEN_ROOT_PATTERNS = [
  /\.py$/i,
  /\.patch$/i,
  /\.sh$/i,
  /\.tmp$/i,
  /\.bak$/i,
  /\.log$/i,
  /^test-.*\.(js|ts|mjs)$/i,
  /^patch_.*$/i,
  /^scratch.*$/i,
  /^body\.html$/i,
  /^screenshot\.js$/i,
];

console.log('🔍 [Artifact Checker] Scanning root boundary and orphaned root artifacts...');

const rootEntries = readdirSync(rootDir);

for (const entry of rootEntries) {
  if (entry === '.DS_Store') continue;

  const fullPath = join(rootDir, entry);
  const isDirectory = statSync(fullPath).isDirectory();

  if (isDirectory) {
    if (!ALLOWED_ROOT_DIRECTORIES.has(entry)) {
      violations.push({
        category: 'ROOT_UNAUTHORIZED_DIRECTORY',
        target: `${entry}/`,
        lifecycle: 'Non-Compliant / Orphaned Directory',
        remediation: `Remove directory or register in ALLOWED_ROOT_DIRECTORIES if legitimate. See docs/operations/ARTIFACT_LIFECYCLE.md.`,
      });
    }
  } else {
    const isForbiddenPattern = FORBIDDEN_ROOT_PATTERNS.some((pattern) => pattern.test(entry));
    if (isForbiddenPattern) {
      violations.push({
        category: 'ROOT_FORBIDDEN_FILE_PATTERN',
        target: entry,
        lifecycle: 'Ephemeral / Orphaned Patch Artifact',
        remediation: `Move historical patches to "scripts/maintenance/applied_patches/" or delete ephemeral scratchpads.`,
      });
      continue;
    }

    if (!ALLOWED_ROOT_FILES.has(entry)) {
      violations.push({
        category: 'ROOT_ORPHANED_FILE',
        target: entry,
        lifecycle: 'Orphaned / Unapproved Root File',
        remediation: `File is not in approved root whitelist. Move to appropriate subdirectory or delete.`,
      });
    }
  }
}

// ============================================================================
// 2. Scripts Directory Boundary & Loose Runner Validation
// ============================================================================

console.log('🔍 [Artifact Checker] Validating scripts directory compliance...');

const scriptsDir = join(rootDir, 'scripts');
if (existsSync(scriptsDir)) {
  const allowedScriptsRootEntries = new Set([
    'check-artifacts.js',
    'maintenance',
    'package.json',
    'post-merge.sh',
    'pre-commit.sh',
    'prepare-dist.mjs',
    'run-node-tests.mjs',
    'smoke-test-deployment.mjs',
    'verify-repo-hygiene.mjs',
    'verify-vercel-output.mjs',
  ]);

  const scriptEntries = readdirSync(scriptsDir);
  for (const entry of scriptEntries) {
    if (entry === '.DS_Store') continue;
    if (!allowedScriptsRootEntries.has(entry)) {
      violations.push({
        category: 'SCRIPTS_UNAUTHORIZED_ENTRY',
        target: `scripts/${entry}`,
        lifecycle: 'Orphaned Script / Unapproved Runner',
        remediation: `Only active runners are permitted at scripts/ root. Move one-off scripts to "scripts/maintenance/applied_patches/".`,
      });
    }
  }
}

// ============================================================================
// 3. Documentation Topology & Uncurated Dump Validation
// ============================================================================

console.log('🔍 [Artifact Checker] Validating documentation topology and asset curation...');

const docsDir = join(rootDir, 'docs');
if (existsSync(docsDir)) {
  const allowedDocsRootDirs = new Set([
    'api',
    'architecture',
    'decisions',
    'history',
    'operations',
    'plans',
  ]);
  const allowedDocsRootFiles = new Set(['README.md', 'PARETO_GUIDELINES.md']);

  const docsEntries = readdirSync(docsDir);
  for (const entry of docsEntries) {
    if (entry === '.DS_Store') continue;
    const fullPath = join(docsDir, entry);
    const isDir = statSync(fullPath).isDirectory();

    if (isDir && !allowedDocsRootDirs.has(entry)) {
      violations.push({
        category: 'DOCS_TOPOLOGY_VIOLATION',
        target: `docs/${entry}`,
        lifecycle: 'Uncurated / Non-compliant Documentation Directory',
        remediation: `Docs must conform to docs/README.md topology. Archive historical personas under docs/history/personas/.`,
      });
    } else if (!isDir && !allowedDocsRootFiles.has(entry)) {
      violations.push({
        category: 'DOCS_UNAUTHORIZED_FILE',
        target: `docs/${entry}`,
        lifecycle: 'Misplaced Documentation Artifact',
        remediation: `Top-level docs are restricted to README.md and PARETO_GUIDELINES.md. File should be moved into category subdirectory.`,
      });
    }
  }
}

// ============================================================================
// 4. Source Tree Purity (apps/web/src, api/, lib/)
// ============================================================================

console.log('🔍 [Artifact Checker] Validating source tree purity across active codebases...');

const sourceFoldersToCheck = [
  join(rootDir, 'apps', 'web', 'src'),
  join(rootDir, 'api'),
  join(rootDir, 'lib'),
];

const FORBIDDEN_SOURCE_EXTENSIONS = [
  /\.py$/i,
  /\.patch$/i,
  /\.bak$/i,
  /\.tmp$/i,
  /\.orig$/i,
  /\.swp$/i,
];

const FORBIDDEN_SOURCE_NAMES = [
  /^scratch\./i,
  /^test-import\./i,
  /^test_leak\./i,
];

function scanSourceTree(dir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.DS_Store') continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanSourceTree(fullPath);
    } else {
      const hasForbiddenExt = FORBIDDEN_SOURCE_EXTENSIONS.some((ext) => ext.test(entry));
      const hasForbiddenName = FORBIDDEN_SOURCE_NAMES.some((namePattern) => namePattern.test(entry));

      if (hasForbiddenExt || hasForbiddenName) {
        violations.push({
          category: 'SOURCE_PURITY_VIOLATION',
          target: relative(rootDir, fullPath),
          lifecycle: 'Ephemeral / Scratchpad Leaked into Source Tree',
          remediation: `Remove temporary or scratchpad file from active source tree.`,
        });
      }
    }
  }
}

for (const folder of sourceFoldersToCheck) {
  scanSourceTree(folder);
}

// ============================================================================
// 5. Results & Enforcement Gate Exit
// ============================================================================

if (violations.length > 0) {
  console.error('\n❌ [Artifact Checker] Artifact lifecycle non-compliance detected!');
  console.error('─────────────────────────────────────────────────────────────────────────────');
  for (const v of violations) {
    console.error(`  [${v.category}] ${v.target}`);
    console.error(`    State:       ${v.lifecycle}`);
    console.error(`    Remediation: ${v.remediation}\n`);
  }
  console.error('─────────────────────────────────────────────────────────────────────────────');
  console.error('📖 Refer to docs/operations/ARTIFACT_LIFECYCLE.md for full structural policies.\n');
  process.exit(1);
}

console.log('✅ [Artifact Checker] All artifacts comply with repository lifecycle specifications.');
process.exit(0);
