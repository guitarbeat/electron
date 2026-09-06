# Artifact Lifecycle Management & Mechanical Enforcement

This document defines the lifecycle states, structural boundaries, and mechanical verification rules for all artifacts in the Collaborative Movie Night ("Electron") monorepo.

---

## 1. The Core Problem: Policy vs. Enforcement

A common failure mode in software repositories is **organizational drift**:
- Policies and folder taxonomies are documented in markdown.
- However, when developers or AI coding agents work on iterative fixes, temporary artifacts (`patch_*.py`, `*.patch`, scratchpad scripts, raw prompt dumps) accumulate in the root or source folders.
- Over time, navigation degrades despite repeated manual reorganizations.

In accordance with **Root Cause Analysis (RCA)** and the **Toyota Production System (Poka-Yoke)**:
> **Documented policies are weak barriers. Automated test failures are hard barriers.**

Every lifecycle rule defined in this document is mechanically enforced by `scripts/verify-repo-hygiene.mjs` and verified on every run of `pnpm verify`.

---

## 2. The Four Artifact Lifecycle States

| State | Scope & Intent | Permitted Locations | Enforcement Gate |
| :--- | :--- | :--- | :--- |
| **Active** | Production code, active tests, live documentation, and core configs. | `apps/web/src`, `api/`, `lib/`, `docs/`, root config files (`package.json`, `tsconfig.json`). | Verified by `check-types`, `lint`, and `test`. |
| **Ephemeral / Scratchpad** | Debugging scripts, test payloads, temporary snapshots, and exploratory code. | `.scratch/`, `tmp/` (strictly `.gitignore`d). | Forbidden at repository root; rejected by `verify-repo-hygiene.mjs`. |
| **Archived** | One-off historical transformations, legacy ADRs, applied patches, and historical personas. | `scripts/maintenance/applied_patches/`, `docs/history/`. | Must include descriptive README or headers. Non-executable in CI. |
| **Deprecated** | Stale code, abandoned experiments, obsolete configurations. | None (must be deleted). | Code that is no longer referenced must be pruned, not commented out or left orphaned. |

---

## 3. Structural Boundary Rules

### 3.1 Repository Root Boundary
- **Allowed Directories**: `.agents`, `.git`, `.github`, `.jules`, `.vercel`, `agent`, `api`, `apps`, `assets`, `dist`, `docs`, `e2e-tests`, `lib`, `node_modules`, `scripts`, `src`.
- **Allowed Files**: Standard configuration files (`package.json`, `tsconfig.json`, `metadata.json`, `README.md`, `CHANGELOG.md`, `LICENSE`, `eslint.config.js`, `pnpm-workspace.yaml`, `.gitignore`, `.env.example`).
- **Forbidden Patterns**: Any `.py`, `.patch`, `.sh`, `.tmp`, `.bak`, `.log`, or `test-*` file at root causes an immediate exit code `1`.

### 3.2 Scripts Directory Boundaries (`scripts/`)
- Root of `scripts/` is reserved strictly for active build/test/deployment runners (`prepare-dist.mjs`, `run-node-tests.mjs`, `smoke-test-deployment.mjs`, `verify-repo-hygiene.mjs`, `verify-vercel-output.mjs`, `post-merge.sh`).
- Any one-off database migration, data patching, or legacy transformation script must be placed inside `scripts/maintenance/applied_patches/`.

### 3.3 Documentation Directory Boundaries (`docs/`)
- All documentation must adhere to the topology described in `docs/README.md`:
  - `docs/architecture/` (Architectural specs, design tokens)
  - `docs/operations/` (Development, deployment, lifecycle guides)
  - `docs/api/` (Machine and developer contracts)
  - `docs/decisions/` (Architecture Decision Records)
  - `docs/history/` (Timeline, legacy snapshots, archived personas)
  - `docs/plans/` (Execution plans)
- Raw asset dumps (e.g. pasted text files, ad-hoc chat logs) must be archived under `docs/history/personas/` or removed.

---

## 4. Mechanical Verification & CI Enforcement

Artifact compliance and repository hygiene are validated mechanically on multiple levels:

### 4.1 Independent & Local Checks
```bash
# Run artifact lifecycle and compliance check directly
pnpm check-artifacts
# or via pre-commit script
bash scripts/pre-commit.sh

# Run repository hygiene check independently
pnpm check-hygiene

# Run full pre-commit/pre-deploy verification pipeline
pnpm verify
```

### 4.2 CI Gates & Build Pipeline Integration
- **Pre-Commit Hook**: `scripts/pre-commit.sh` and `pnpm pre-commit` execute `scripts/check-artifacts.js` to block invalid commits locally before reaching the remote repository.
- **CI Pipelines**: In `.github/workflows/ci.yml`, the `check-artifacts` validation runs as an explicit, blocking step in both the `typecheck-and-lint` and `build` jobs. Any non-compliant or orphaned artifact immediately fails CI before build and deployment.
- **Local Builds**: `pnpm build` triggers `scripts/check-artifacts.js` as its first step, ensuring that production bundles cannot be generated from a dirty or non-compliant working tree.

If any unauthorized artifact or forbidden pattern is introduced, the verification fails with actionable remediation instructions.
