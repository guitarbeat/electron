#!/usr/bin/env node

/**
 * Mechanical Enforcement Gate: Repository Hygiene & Artifact Lifecycle
 *
 * Enforces strict boundary rules for root artifacts, internal directory
 * boundaries, and prevents temporary/scratchpad files (*.py, *.patch, *.bak)
 * from cluttering active code or documentation directories.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const violations = [];

// ============================================================================
// 1. Root Directory Boundary Validation
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
];

console.log('🔍 [Repo Hygiene] Validating repository root artifact boundaries...');

const rootEntries = readdirSync(rootDir);

for (const entry of rootEntries) {
  if (entry === '.DS_Store') continue;

  const fullPath = join(rootDir, entry);
  const isDirectory = statSync(fullPath).isDirectory();

  if (isDirectory) {
    if (!ALLOWED_ROOT_DIRECTORIES.has(entry)) {
      violations.push({
        type: 'ROOT_UNAUTHORIZED_DIRECTORY',
        target: entry,
        message: `Directory "${entry}/" is not in ALLOWED_ROOT_DIRECTORIES.`,
      });
    }
  } else {
    const isForbiddenPattern = FORBIDDEN_ROOT_PATTERNS.some((p) => p.test(entry));
    if (isForbiddenPattern) {
      violations.push({
        type: 'ROOT_FORBIDDEN_FILE_PATTERN',
        target: entry,
        message: `File "${entry}" matches a temporary/scratchpad pattern. Move one-off patches to "scripts/maintenance/applied_patches/" or delete.`,
      });
      continue;
    }

    if (!ALLOWED_ROOT_FILES.has(entry)) {
      violations.push({
        type: 'ROOT_UNAUTHORIZED_FILE',
        target: entry,
        message: `File "${entry}" is not in ALLOWED_ROOT_FILES. Add to allowlist in scripts/verify-repo-hygiene.mjs if permanent.`,
      });
    }
  }
}

// ============================================================================
// 2. Scripts Directory Boundary Validation
// ============================================================================

console.log('🔍 [Repo Hygiene] Validating scripts/ directory boundaries...');

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
        type: 'SCRIPTS_UNAUTHORIZED_ENTRY',
        target: `scripts/${entry}`,
        message: `Loose entry "scripts/${entry}" not permitted. Move historical/one-off patches into "scripts/maintenance/applied_patches/".`,
      });
    }
  }
}

// ============================================================================
// 3. Docs Directory Topology Validation
// ============================================================================

console.log('🔍 [Repo Hygiene] Validating docs/ topology boundaries...');

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
        type: 'DOCS_UNAUTHORIZED_DIRECTORY',
        target: `docs/${entry}`,
        message: `Directory "docs/${entry}" does not conform to the docs topology. Archive under "docs/history/" or document in docs/README.md.`,
      });
    } else if (!isDir && !allowedDocsRootFiles.has(entry)) {
      violations.push({
        type: 'DOCS_UNAUTHORIZED_FILE',
        target: `docs/${entry}`,
        message: `File "docs/${entry}" is not an approved top-level document. Place inside the appropriate category folder.`,
      });
    }
  }
}

// ============================================================================
// 4. Source Tree Purity Validation (No ephemeral debris in source trees)
// ============================================================================

console.log('🔍 [Repo Hygiene] Validating source tree purity in apps/web/src, api/, lib/...');

const sourceFoldersToCheck = [
  join(rootDir, 'apps', 'web', 'src'),
  join(rootDir, 'api'),
  join(rootDir, 'lib'),
];

const FORBIDDEN_SOURCE_EXTENSIONS = [/\.py$/i, /\.patch$/i, /\.bak$/i, /\.tmp$/i];

function walkDirectory(dir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.DS_Store') continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else {
      const isForbidden = FORBIDDEN_SOURCE_EXTENSIONS.some((ext) => ext.test(entry));
      if (isForbidden) {
        violations.push({
          type: 'SOURCE_FORBIDDEN_FILE',
          target: relative(rootDir, fullPath),
          message: `Forbidden temporary/patch file located in source tree.`,
        });
      }
    }
  }
}

for (const folder of sourceFoldersToCheck) {
  walkDirectory(folder);
}

// ============================================================================
// 5. Result Reporting & Enforcement Exit
// ============================================================================

if (violations.length > 0) {
  console.error('\n❌ [Repo Hygiene] Artifact lifecycle violations detected:');
  for (const v of violations) {
    console.error(`  - [${v.type}] ${v.target}: ${v.message}`);
  }
  console.error(
    '\n💡 Remediation Guide: See docs/operations/ARTIFACT_LIFECYCLE.md for approved lifecycle states and directory boundaries.\n',
  );
  process.exit(1);
}

console.log('✅ [Repo Hygiene] All boundary checks passed! Root, scripts, docs, and source trees are clean.');
process.exit(0);
