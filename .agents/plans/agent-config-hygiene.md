# Implementation Plan: Agent Config Hygiene

## Overview

Finish the `.agents/` consolidation started by merging `.junie`, `.jules`, and root `skills/` into a single agent home. The `/simplify` pass fixed the highest-risk doc drift (wrong repo overview, broken links, stale skill paths, redundant gitignore rules). This plan covers the remaining work: git reliability, canonical source-tree docs, slimmer agent entrypoints, and clearer boundaries between human docs (`docs/`) and agent tacit knowledge (`.agents/memory/`).

## Architecture Decisions

- **Single agent entrypoint:** Root `AGENTS.md` stays tool-discovered; `.agents/README.md` is layout-only; `.agents/guidelines.md` holds agent-facing conventions with links to `docs/`, not duplicated architecture prose.
- **Canonical source tree:** Pick one tree for agent instructions — root `src/` (current `pnpm dev` path) — and treat `artifacts/electron/` as historical/mirror context with explicit cross-links in memory.
- **Ephemeral agent artifacts stay out of git:** `.agents/sessions/`, `.agents/scratch/` outputs, `.paintress/`, and Paintress metadata exports follow the same ignore policy as `.migration-backup/`.
- **Scoped git commands until full-repo status is fast:** Use path-limited diffs for agent work; fix root cause separately.

## Current State (post-simplify)

**Done:**
- `AGENTS.md` describes the movie app, links `.agents/`, merged intent/lifecycle table, removed broken orchestration links
- `.gitignore` drops redundant `.env*.local`, ignores `.agents/sessions/`
- `.agents/README.md` documents full layout including `agent_assets_metadata.toml`
- `.agents/guidelines.md` links `docs/DEVELOPMENT.md`, correct persistence model
- Stale `skills/...` paths fixed in `spec-driven-development` and `doubt-driven-development`

**Remaining:**
- Full `git status` hangs (stale lock + heavy index suspected)
- `AGENTS.md` still contains ~100 lines of skill-authoring boilerplate
- `guidelines.md` structure section overlaps `docs/ARCHITECTURE.md`
- Memory entries reference `artifacts/electron/` while docs reference root `src/`
- Tracked `.agents/sessions/paintress-messages.json` (~121 KB) still in git history/index
- No `docs/decisions/` ADR home despite skill guidance
- Scratch scripts target multiple trees (`.migration-backup/`, `artifacts/`)

---

## Task List

### Phase 1: Stabilize tooling (unblock commits)

## Task 1: Diagnose and fix slow git status

**Description:** Full-repo `git status` and `git diff` hang for minutes and leave stale `.git/index.lock` files. Identify whether the cause is index size, untracked bulk (`.migration-backup/`, `node_modules` leakage), fsmonitor, or concurrent git processes — then apply the minimal fix.

**Acceptance criteria:**
- [ ] `git status --short` completes in under 10 seconds
- [ ] No stale `.git/index.lock` after normal status/diff operations
- [ ] `.gitignore` excludes any newly discovered bulk dirs that should not be indexed

**Verification:**
- [ ] Run `git status --short` twice in a row without hang
- [ ] Run `git diff --name-status HEAD` and confirm output
- [ ] Document workaround in `.agents/guidelines.md` only if a permanent limitation remains

**Dependencies:** None

**Files likely touched:**
- `.gitignore`
- `.agents/guidelines.md` (troubleshooting note, if needed)

**Estimated scope:** Small (1–2 files + investigation)

---

## Task 2: Untrack ephemeral session exports

**Description:** `.agents/sessions/` is gitignored but `paintress-messages.json` remains tracked. Remove it from the index without deleting the local file so future exports stay out of git and agent context scans.

**Acceptance criteria:**
- [ ] `git ls-files .agents/sessions/` returns empty
- [ ] Local file still exists on disk (if user wants to keep it)
- [ ] `.agents/README.md` note about gitignored sessions remains accurate

**Verification:**
- [ ] `git check-ignore -v .agents/sessions/paintress-messages.json` confirms ignore rule
- [ ] Path-scoped `git diff` no longer includes session exports

**Dependencies:** Task 1 (git must be usable)

**Files likely touched:**
- `.agents/sessions/paintress-messages.json` (index only via `git rm --cached`)

**Estimated scope:** XS

### Checkpoint: Foundation
- [ ] Git commands reliable enough to commit agent-hygiene work
- [ ] No large session exports tracked

---

### Phase 2: Documentation architecture

## Task 3: Slim `AGENTS.md` — move skill authoring to `.agents/skills/README.md`

**Description:** Extract the "Creating a New Skill" section (~100 lines: format template, script rules, zip/install) from root `AGENTS.md` into a dedicated `.agents/skills/README.md`. Leave a short pointer in `AGENTS.md` for progressive disclosure.

**Acceptance criteria:**
- [ ] `AGENTS.md` retains rules, intent mapping, orchestration, and a one-paragraph pointer to skill authoring docs
- [ ] `.agents/skills/README.md` contains the full authoring template and installation instructions
- [ ] `.agents/README.md` links to the new skills README

**Verification:**
- [ ] Read `AGENTS.md` — under 120 lines of operational guidance
- [ ] All zip/install path examples use `.agents/skills/`

**Dependencies:** None (can parallelize with Task 1)

**Files likely touched:**
- `AGENTS.md`
- `.agents/skills/README.md` (new)
- `.agents/README.md`

**Estimated scope:** Small (3 files)

---

## Task 4: Deduplicate `guidelines.md` with `docs/`

**Description:** Replace duplicated structure/commands prose in `.agents/guidelines.md` with links to `docs/README.md`, `docs/ARCHITECTURE.md`, and `docs/DEVELOPMENT.md`. Keep only agent-specific conventions (extend-don't-fork, `src/utils/` placement, styling preferences).

**Acceptance criteria:**
- [ ] `guidelines.md` structure section is ≤15 lines or link-only
- [ ] No stale persistence/deployment claims
- [ ] Agent-specific conventions remain explicit

**Verification:**
- [ ] Manual read: no paragraph duplicated verbatim from `docs/ARCHITECTURE.md`
- [ ] All relative links resolve

**Dependencies:** None

**Files likely touched:**
- `.agents/guidelines.md`

**Estimated scope:** XS

---

## Task 5: Reconcile source-tree references in memory and scratch

**Description:** Audit `.agents/memory/*.md` and `.agents/scratch/*` for `artifacts/electron/` paths. Add a canonical-source note at the top of `MEMORY.md` and update high-traffic memory entries to reference root `src/` as primary, with `artifacts/electron/` labeled as Replit-era mirror where still relevant.

**Acceptance criteria:**
- [ ] `MEMORY.md` index states canonical tree: root `src/`, `api/`, `pnpm dev`
- [ ] `electron-migration.md` cross-links `docs/HISTORY.md` and `docs/ARCHITECTURE.md`
- [ ] Scratch scripts either target canonical paths or carry a header comment "historical — do not run"

**Verification:**
- [ ] Grep `.agents/memory` for `artifacts/electron` — each hit has mirror/historical context or is updated
- [ ] No scratch script writes to `.migration-backup/` without an explicit warning

**Dependencies:** Task 4 (guidelines/docs alignment)

**Files likely touched:**
- `.agents/memory/MEMORY.md`
- `.agents/memory/electron-migration.md`
- Selected `.agents/scratch/*` (comments only unless promoted)

**Estimated scope:** Medium (5–8 files)

### Checkpoint: Documentation
- [ ] Agent entry docs are short, linked, and non-contradictory
- [ ] Canonical `src/` tree is explicit for agents

---

### Phase 3: Longer-term hygiene

## Task 6: Add `docs/decisions/` ADR scaffold

**Description:** Create `docs/decisions/README.md` with a lightweight ADR template (status, context, decision, consequences). Link from `.agents/memory/MEMORY.md` for durable decisions that outgrow informal memory notes.

**Acceptance criteria:**
- [ ] `docs/decisions/README.md` exists with template and index table
- [ ] `docs/README.md` indexes the new section
- [ ] `documentation-and-adrs` skill examples match actual path

**Verification:**
- [ ] Link check from `docs/README.md` → `docs/decisions/README.md`

**Dependencies:** Task 4

**Files likely touched:**
- `docs/decisions/README.md` (new)
- `docs/README.md`
- `.agents/memory/MEMORY.md`

**Estimated scope:** Small (3 files)

---

## Task 7: Scratch directory policy

**Description:** Decide and document what belongs in `.agents/scratch/` vs root `scripts/` vs `docs/`. Move durable plans (`ui-prune-plan.md`) to `.agents/plans/` or archive; add README in scratch explaining disposable vs promoted scripts.

**Acceptance criteria:**
- [ ] `.agents/scratch/README.md` explains promotion criteria
- [ ] No durable plan docs left in scratch (or they are clearly marked archived)
- [ ] Repeatable automation lives in root `scripts/` if promoted

**Verification:**
- [ ] Inventory of scratch files with disposition (keep / archive / promote / delete)

**Dependencies:** Task 5

**Files likely touched:**
- `.agents/scratch/README.md` (new)
- `.agents/plans/` (moved files)
- Possibly `scripts/` (if promoting)

**Estimated scope:** Medium

---

## Task 8: Root README agent-config pointer

**Description:** Add a Documentation bullet in root `README.md` mirroring the `docs/` index pattern: `AGENTS.md` → `.agents/README.md`.

**Acceptance criteria:**
- [ ] `README.md` §Documentation mentions agent config path
- [ ] Wording matches existing doc index style

**Verification:**
- [ ] Read `README.md` — one new bullet, no duplication of `AGENTS.md` body

**Dependencies:** Task 3

**Files likely touched:**
- `README.md`

**Estimated scope:** XS

### Checkpoint: Complete
- [ ] All acceptance criteria for Tasks 1–8 met or explicitly deferred with rationale
- [ ] Path-scoped `git diff HEAD -- AGENTS.md .agents/ docs/` is clean or ready to commit
- [ ] Human review before merging agent-hygiene batch

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Full `git status` stays slow | High — blocks normal workflow | Task 1 first; use scoped diffs until fixed |
| Removing tracked session file surprises user | Low | `git rm --cached` only; keep local copy |
| `artifacts/electron/` still used in some workflows | Medium | Confirm with `package.json` / `vite.config.ts` before rewriting memory |
| Slimming `AGENTS.md` breaks tool discovery | Medium | Keep all operational rules in `AGENTS.md`; only move authoring boilerplate |
| Scratch script moves break nothing | Low | Comments/archive only in Task 7; no behavior changes |

## Parallelization Opportunities

| Can run in parallel | Must be sequential |
|---------------------|-------------------|
| Task 3 + Task 4 (different files) | Task 2 after Task 1 |
| Task 6 + Task 8 after Task 3/4 | Task 5 after Task 4 |
| Task 7 after Task 5 inventory | |

## Open Questions

1. **Is `artifacts/electron/` still deployed or dev-used?** If yes, memory should document both trees; if no, migration memory can be archived to `docs/HISTORY.md`.
2. **Should `agent_assets_metadata.toml` stay tracked?** Alternative: gitignore and reference `DESIGN.md` directly.
3. **Restore `agents/` personas directory?** Only needed if using Claude Code subagents from this repo; otherwise keep orchestration rules inline in `AGENTS.md`.

## Suggested execution order

```
Task 1 → Task 2 → Task 3 + Task 4 (parallel) → Task 5 → Task 6 + Task 8 (parallel) → Task 7
```

**First session:** Tasks 1–2 (unblock git, clean index)  
**Second session:** Tasks 3–5 (doc architecture)  
**Third session:** Tasks 6–8 (ADRs, scratch policy, README pointer)
