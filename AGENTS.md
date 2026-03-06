# AGENTS.md

## Purpose
Working guide for contributors and coding agents in this repository.

## Project Baseline
- Runtime: Node.js 20+
- Package manager: `pnpm`
- App stack: Vite + React + TypeScript
- Main app entry: `src/index.tsx`

## Workflows

### 1) Bootstrap
1. Install dependencies: `pnpm install`
2. Create local env file (if missing): `Copy-Item .env.example .env.local` (PowerShell)
3. Start dev server: `pnpm run dev`

### 2) Daily Feature Workflow
1. Sync your branch with `main`:
   - `bash "scripts/jules-sync 2.sh"`
   - Fallback: `git fetch origin main && git merge --no-edit origin/main`
2. Implement changes in `src/` (preferred source tree).
3. Run targeted tests for the area you touched.
4. Run the quality gate before opening a PR.

### 3) Quality Gate (PR/CI Parity)
Run these in order:
1. `pnpm run check:case-collisions`
2. `pnpm run lint`
3. `npx prettier --check .`
4. `pnpm run check-types`
5. `pnpm run build`

### 4) Testing Workflow
- Full test sweep: `pnpm run test:all`
- Focused test suites:
  - `pnpm run test:snake`
  - `pnpm run test:memories`
  - `pnpm run test:security`
  - `pnpm run test:quiz`

### 5) Release/Deploy Prep
1. Pull Vercel env vars when needed: `pnpm run vercel:env`
2. Confirm build output: `pnpm run build`
3. Sanity-check production bundle locally: `pnpm run preview`

## Command Reference
- `pnpm run dev`: start local development server
- `pnpm run build`: create production build in `dist/`
- `pnpm run build:dev`: build using development mode
- `pnpm run preview`: serve built app locally
- `pnpm run lint`: run ESLint on TypeScript source files
- `pnpm run format`: run Prettier write mode on repository files
- `pnpm run check-types`: run TypeScript compile checks without emit
- `pnpm run check:case-collisions`: fail if tracked file paths differ only by case
- `bash scripts/pre_commit_check.sh`: lightweight pre-commit check script
- `bash "scripts/jules-sync 2.sh"`: merge latest `origin/main` into current branch

## Notes
- Bash scripts require Git Bash/WSL on Windows.
- `scripts/jules-sync 2.sh` intentionally fails when run on `main`.
- `pnpm run format` modifies files; use `npx prettier --check .` for read-only verification.
