# Implementation Plan: Repo Root & Agent Config Cleanup

## Overview

Consolidate all AI-agent configuration under `.agents/`, remove duplicate skills and platform-specific dot dirs, delete local caches/backups, and establish guardrails so the root stays clean. Most of the work is done and staged (~457 files); this plan covers shipping it, verifying nothing broke, and preventing regression.

## Architecture Decisions

- **Single agent home:** `.agents/` owns skills, guidelines, memory, plans, scratch, and sessions. Root `AGENTS.md` stays as the auto-discovered entry point but only references `.agents/`.
- **No duplicate skills:** Root `skills/` is removed; `.agents/skills/` is canonical (includes `idea-refine` extras + `thermo-nuclear-code-quality-review`).
- **Caches never tracked:** `.migration-backup/`, `.next/`, `.vercel/`, `.canvas/`, `env.txt`, and `*.tsbuildinfo` are gitignored and deleted locally.
- **Git hygiene:** Avoid `git add -A` after large index changes; use path-scoped staging with `core.fsmonitor=false` when status is slow.

## Task List

### Phase 1: Ship the cleanup

## Task 1: Review staged diff (path-scoped)

**Description:** Confirm the staged changes match intent before committing. Focus on agent consolidation, cache removal, and `.gitignore` — not unrelated node_modules noise.

**Acceptance criteria:**
- [ ] Staged changes include `.agents/` additions, removal of `skills/`, `.junie/`, `.jules/`, `.lovable/`, `.paintress/`, `.canvas/`, `.next/`, `env.txt`, and `.migration-backup/` untracking
- [ ] No secrets (`.env.local`, API keys) are staged
- [ ] `AGENTS.md` paths point to `.agents/skills/` and `.agents/guidelines.md`

**Verification:**
- [ ] `git -c core.fsmonitor=false diff --cached --name-only | rg '^(skills|\.junie|\.jules|\.agents|AGENTS|\.gitignore)'` shows expected files
- [ ] `git -c core.fsmonitor=false diff --cached --name-only | rg '\.env'` returns nothing

**Dependencies:** None

**Files likely touched:** (review only)

**Estimated scope:** Small

---

## Task 2: Commit the cleanup

**Description:** Create one focused commit capturing the root cleanup and agent consolidation.

**Acceptance criteria:**
- [ ] Single commit with a clear message (why: one agent home, less root clutter)
- [ ] Pre-commit hooks pass (or failures are fixed in a follow-up commit, not amend)

**Verification:**
- [ ] `git log -1 --oneline` shows the cleanup commit
- [ ] Root has no `skills/`, `.junie/`, `.jules/`, `.migration-backup/`, `.next/`, `.vercel/`, `.canvas/`

**Dependencies:** Task 1

**Estimated scope:** Small

---

## Task 3: Run project verification

**Description:** Prove the app still builds and tests pass after the structural changes (no runtime code changed, but CI confidence matters).

**Acceptance criteria:**
- [ ] `pnpm verify` exits 0 (or existing failures are documented as pre-existing)

**Verification:**
- [ ] `pnpm verify`

**Dependencies:** Task 2

**Estimated scope:** Small

### Checkpoint: Cleanup shipped
- [ ] Commit exists, root is clean, verify passes or failures are known

---

### Phase 2: Documentation alignment

## Task 4: Cross-link docs to `.agents/`

**Description:** Update human-facing docs so they don't reference removed paths.

**Acceptance criteria:**
- [ ] `docs/README.md` links to `.agents/README.md` for agent setup
- [ ] No docs reference root `skills/`, `.junie/`, or `.jules/`
- [ ] `docs/AGENTS.md` (Vercel tips) is clearly separate from root `AGENTS.md` (or renamed to avoid confusion)

**Verification:**
- [ ] `rg 'skills/|\.junie|\.jules' docs/ AGENTS.md .agents/` — only `.agents/skills/` hits

**Dependencies:** Task 2

**Files likely touched:**
- `docs/README.md`
- Possibly `docs/AGENTS.md` → rename to `docs/VERCEL.md`

**Estimated scope:** Small

---

## Task 5: Tighten `.aiignore`

**Description:** Mirror `.gitignore` cache/backup patterns so AI tools don't re-read cruft.

**Acceptance criteria:**
- [ ] `.aiignore` includes `.migration-backup/`, `.canvas/`, `.agents/scratch/`, `.agents/sessions/`

**Verification:**
- [ ] Manual review of `.aiignore`

**Dependencies:** Task 2

**Estimated scope:** XS

### Checkpoint: Docs aligned
- [ ] New contributors and agents land on `.agents/` without confusion

---

### Phase 3: Optional deeper cleanup

## Task 6: Audit root-level non-app artifacts

**Description:** Review remaining root items that aren't standard project files.

**Acceptance criteria:**
- [ ] Decision recorded for each: keep, move to `.agents/scratch/`, or delete
- [ ] Candidates: `attached_assets/`, `bun.lock` (if pnpm-only), `replit.md`, duplicate lockfiles

**Verification:**
- [ ] Short note in `.agents/memory/` or this plan's "Decisions" section

**Dependencies:** Task 3

**Estimated scope:** Small

---

## Task 7: Prune `.agents/scratch/` after 30 days

**Description:** Scratch holds one-off patch scripts and draft PR text. Delete or archive once no longer needed.

**Acceptance criteria:**
- [ ] Scratch directory empty or reduced to actively used scripts only

**Dependencies:** Task 2

**Estimated scope:** XS

---

## Task 8: Git index maintenance (if status stays slow)

**Description:** If `git status` remains sluggish, run maintenance and avoid broad staging.

**Acceptance criteria:**
- [ ] `git status` completes in <10s
- [ ] Team convention: path-scoped `git add`, never `git add -A` after bulk deletes

**Verification:**
- [ ] `git -c core.fsmonitor=false status -uno` timing acceptable
- [ ] Optional: `git gc --prune=now` if object store is bloated

**Dependencies:** Task 2

**Estimated scope:** Small

### Checkpoint: Complete
- [ ] Root clean, agent config unified, docs aligned, guardrails in place

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cursor/OpenCode expects skills at old path | Med | Root `AGENTS.md` updated; symlink `skills` → `.agents/skills` only if a tool breaks |
| Large staged diff hides accidental changes | High | Path-scoped review before commit (Task 1) |
| `git status` hangs on huge index | Med | Use `core.fsmonitor=false`, path-scoped commands; run `git gc` if needed |
| `.agents/scratch/` re-accumulates | Low | Periodic prune (Task 7); gitignore sessions if ephemeral |

## Open Questions

- **Commit now or split?** One commit is fine for this cleanup; split only if unrelated app changes are mixed in.
- **`attached_assets/` and `bun.lock`:** Keep if Replit/YouWare still use them; otherwise remove in Task 6.
- **`docs/AGENTS.md` vs root `AGENTS.md`:** Rename Vercel doc to `docs/VERCEL.md` to reduce agent confusion?

## Current State

| Item | Status |
|------|--------|
| `.agents/` consolidated | Done |
| Caches gitignored and removed locally | Done |
| Docs aligned (`docs/VERCEL.md`, `.agents/README.md`) | Done |
| `pnpm verify` passes | Done |
| CI runs `pnpm verify` | Done |
| Scratch historical scripts pruned | Done |
| `git status` fast (`core.fsmonitor=false`) | Done |
