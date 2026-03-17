# Repository Simplification Plan

Date: March 7, 2026  
Owner: Aaron (with Codex support)

## Why this exists
The codebase is too fragmented for a two-person app. Feature work, bug fixes, and visual changes are slowed by file sprawl and overlapping component patterns.

## Baseline (today)
- `src/` files: **225**
- `src/components`: **144** files
- `src/services`: **31** files
- `src/hooks`: **22** files
- Highest-density areas:
  - `src/components/ui`: 23
  - `src/components/quiz`: 23
  - `src/components/watchlist`: 19
  - `src/components/common`: 18

## Target state
- Practical target for this app: **90-120 files in `src/`**.
- Single clear ownership per feature.
- No duplicate UI patterns for the same function (login/profile, movie card styles, modal patterns).
- Small number of stable shared primitives.

## Non-goals
- No full rewrite.
- No visual redesign during structure-only phases.
- No backend/storage re-architecture unless required for simplification.

## Constraints
- App must stay deployable at each step.
- Lint, typecheck, tests, and build must pass before merge.
- One simplification PR at a time.

## Phased plan

### Phase 1: Remove obvious redundancy (1-2 days)
Goal: quick cleanup with minimal risk.

Actions:
- Keep exactly one profile/login interaction pattern.
- Remove dead/unused components and stale CSS blocks.
- Remove duplicate style definitions for movie cards.
- Collapse tiny wrappers that only pass props.

Exit criteria:
- No duplicate profile selectors rendered.
- No duplicate style blocks for identical UI surfaces.
- `src/` reduced by at least **15 files**.

### Phase 2: Consolidate watchlist/movie surface (2-4 days)
Goal: make the primary user flow easy to reason about.

Actions:
- Merge `movie` + `watchlist` overlap into one feature module.
- Keep one movie card implementation and one style source.
- Group view/state/actions per feature instead of scattering across folders.
- Move "one-off" helpers local to feature files when globally unused.

Exit criteria:
- Single source for movie card layout/style.
- Fewer cross-folder imports for watchlist flow.
- `src/` reduced by additional **20-30 files**.

### Phase 3: Simplify shared layer (2-3 days)
Goal: make shared code truly shared.

Actions:
- Split shared code into:
  - `shared/ui` (real reusable primitives)
  - `shared/lib` (small utilities)
  - `shared/types` (cross-feature types only)
- Move feature-specific code out of `common`.
- Merge tiny single-use hooks back into feature modules.

Exit criteria:
- `common` folder removed or minimal and purposeful.
- Shared modules have multi-feature consumers.
- `src/` reduced by additional **15-25 files**.

### Phase 4: Service/hook rationalization (2-3 days)
Goal: reduce cognitive overhead in data flow.

Actions:
- Standardize polling/data-fetch lifecycle into one pattern.
- Merge near-duplicate service files by domain.
- Remove “micro-hooks” that only wrap one call.
- Keep tests at domain boundary level instead of per tiny helper.

Exit criteria:
- Clear per-domain service entry points.
- Hook count reduced with no feature regressions.
- `src/` lands in **90-120 file range**.

## Proposed folder model (end state)

```text
src/
  app/
    App.tsx
    AppLayout.tsx
  features/
    watchlist/
    places/
    quiz/
    bubbles/
    matchmaker/
  shared/
    ui/
    lib/
    types/
  services/
    api/
    storage/
```

## High-impact merge candidates
1. Merge watchlist/movie card UI and CSS into one feature path.
2. Collapse profile selection variants into one configurable component.
3. Merge duplicate action buttons/dialog wrappers with identical behavior.
4. Reduce `components/common` by relocating feature-only files.
5. Consolidate workflow/polling service wrappers by domain.

## Working agreement for future development
1. New file only when reuse or complexity justifies it.
2. Prefer adding 30-80 lines to an existing feature file over creating a new micro-file.
3. Feature code stays inside feature folder by default.
4. Shared code requires at least 2 feature consumers.
5. Every PR must include a quick “file count impact” note.

## Tracking and reporting
Track these each Friday:
- `src` file count
- largest folder counts
- average PR files changed
- time-to-ship for a small UI change

Suggested commands:
- `rg --files src | wc -l`
- `rg --files src | awk -F/ '{print $2}' | sort | uniq -c | sort -nr`

## Definition of done for this initiative
- `src` is at or below **120 files**.
- Primary flows (watchlist, login/profile, places) are each understandable from one feature directory.
- A small UI change can be shipped without touching more than 3-5 files in most cases.
