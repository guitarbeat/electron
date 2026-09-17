# Project Artifact Lifecycle & Repository Boundary Rules

This document defines the structural taxonomy, lifecycle states, and mechanical enforcement policies for all files and directories across the repository.

---

## 1. Mechanical Enforcement & Scanning Automation

In accordance with Poka-Yoke (mistake-proofing) and Root Cause Analysis (RCA):
> **Policies written in documentation are weak barriers. Automated failure gates are hard barriers.**

To prevent structural drift and repository clutter, every rule in this specification is mechanically enforced by:
- **Scanner**: `scripts/check-artifacts.js`
- **Hygiene Validator**: `scripts/verify-repo-hygiene.mjs`
- **NPM Script**: `npm run check-artifacts` (and `npm run check-hygiene`)
- **Pre-Commit Hook**: `scripts/pre-commit.sh` / `npm run pre-commit`
- **CI Pipelines**: Integrated into `.github/workflows/ci.yml` under both `typecheck-and-lint` and `build` jobs. Any non-compliant artifact immediately fails the build.

---

## 2. The Four Artifact Lifecycle States

Every file in the repository must belong to one of four declared lifecycle states:

| Lifecycle State | Description & Scope | Permitted File Locations | Automated Gate / Policy |
| :--- | :--- | :--- | :--- |
| **Active** | Production code, active tests, approved configurations, and curated documentation. | `apps/web/src/`, `api/`, `lib/`, `docs/`, approved root configs (`package.json`, `tsconfig.json`). | Continuously verified by TypeScript compiler, ESLint, unit test suites, and artifact scanners. |
| **Ephemeral / Scratchpad** | Exploratory snippets, ad-hoc test payloads, temporary captures, local patches. | `.scratch/`, `tmp/` (strictly `.gitignore`d). | Forbidden from root and source folders. Blocked by `.gitignore` and flagged by `scripts/check-artifacts.js`. |
| **Archived** | Historical one-off migration scripts, applied patches, legacy ADRs, or past prompt personas. | `scripts/maintenance/applied_patches/`, `docs/history/`. | Must be clearly documented with headers or READMEs. Non-executable in automated CI flows. |
| **Deprecated** | Stale code, superseded configurations, abandoned experiments. | *None* | Must be pruned immediately. Code must not be left orphaned or commented out. |

---

## 3. Directory Structural Taxonomy & Boundaries

### 3.1 Repository Root Boundaries
The root directory is strictly reserved for approved top-level domain folders and configuration files.

- **Permitted Root Directories**:
  - `.agents`, `.git`, `.github`, `.jules`, `.vercel`
  - `agent`, `api`, `apps`, `assets`, `dist`, `docs`, `e2e-tests`, `lib`, `node_modules`, `scripts`, `src`
- **Permitted Root Files**:
  - Build & toolchain configs: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `tsconfig.base.json`, `eslint.config.js`, `eslint.config.mjs`, `vercel.json`
  - Core metadata & docs: `metadata.json`, `README.md`, `CHANGELOG.md`, `LICENSE`, `AGENTS.md`, `GEMINI.md`, `.env.example`, `.gitignore`, `.editorconfig`
- **Forbidden Root Artifacts**:
  - Python scripts (`*.py`, `patch_*.py`)
  - Patch diffs (`*.patch`)
  - Loose shell scripts (`*.sh`)
  - Ephemeral scratchpads (`scratch.*`, `test-*`, `body.html`, `screenshot.js`, `*.tmp`, `*.bak`, `*.log`)

### 3.2 Scripts Directory (`scripts/`)
The `scripts/` directory is reserved for active build, test, and release runners.

- **Permitted at `scripts/` root**:
  - `check-artifacts.js`: Repository lifecycle and compliance scanner.
  - `verify-repo-hygiene.mjs`: Monorepo boundary and topology validator.
  - `pre-commit.sh`: Git pre-commit verification hook.
  - `post-merge.sh`: Post-merge migration runner.
  - `prepare-dist.mjs`: Distribution package organizer.
  - `run-node-tests.mjs`: Server and node test runner.
  - `smoke-test-deployment.mjs`: Post-deploy smoke test runner.
  - `verify-vercel-output.mjs`: Serverless output validator.
  - `package.json`: Scripts package configuration.
- **Quarantined Patches**:
  - One-off database migration utilities, applied fixes, or historical maintenance scripts must reside in `scripts/maintenance/applied_patches/`.

### 3.3 Documentation Directory (`docs/`)
All documentation must conform to the taxonomy defined in `docs/README.md`:

```
docs/
├── architecture/       # System design, data flow, design tokens
├── operations/         # Development, deployment, and lifecycle guides
├── api/                # API contracts, OpenAPI specs, agent protocols
├── decisions/          # Architecture Decision Records (ADRs)
├── history/            # Historical milestones, snapshots, archived personas
└── plans/              # Execution plans and delivery trackers
```

- **Top-level docs files**: Only `docs/README.md` and `docs/PARETO_GUIDELINES.md` are permitted at the root of `docs/`.
- **Prohibited**: Ad-hoc dump folders (such as `docs/attached_assets/`). Historical chat logs and prompt personas must be organized into `docs/history/personas/`.

### 3.4 Active Source Trees (`apps/web/src`, `api/`, `lib/`)
The application source trees must remain strictly clean and production-ready.
- **Forbidden**: Any `.py`, `.patch`, `.bak`, `.tmp`, `.orig`, `.swp`, or scratchpad files (`scratch.*`, `test-import.*`, `test_leak.*`).
- Tests must be placed alongside source code using standard extensions (`*.test.ts`, `*.spec.tsx`) or inside `e2e-tests/`.

---

## 4. Verification Workflow

Run the mechanical lifecycle check at any time:

```bash
# Run artifact scanner
npm run check-artifacts

# Run pre-commit script
bash scripts/pre-commit.sh

# Run full repository verification suite
npm run verify
```

If `scripts/check-artifacts.js` reports a violation:
1. Identify the violation category and target file path.
2. If it is an ephemeral file, delete it or move it to a `.gitignore`d location (e.g., `.scratch/`).
3. If it is a historical patch, move it to `scripts/maintenance/applied_patches/`.
4. If it is an uncurated doc asset, move it to `docs/history/personas/`.
5. Rerun `npm run check-artifacts` to confirm compliance.
