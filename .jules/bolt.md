## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Commented Out Code in `lib/db/src/schema/index.ts`)
Task requested removing commented-out code from `lib/db/src/schema/index.ts:7`, but the file currently contains only `export {};`. Documented the discrepancy with no code changes to `lib/db/src/schema/index.ts`.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Type Bypassing Casts in api/agent.ts)
Task requested removing type bypassing casts (as any[]) in api/agent.ts:108, but api/agent.ts is already strongly typed using CatalogItem[] and contains no as any[] casts.

## 2026-09-03 - Stale Prompt Discrepancy (Fix initial offset calculation in fix_drift_wall_sync.py)
Task requested fixing the initial offset calculation in `scripts/maintenance/applied_patches/fix_drift_wall_sync.py:13` to include elapsed time in `apps/web/src/components/ui/DriftWall.tsx`. However, `apps/web/src/components/ui/DriftWall.tsx` was already updated in a previous refactor and no longer contains the target code pattern `(_, i) => offsetsRef.current[i] ?? ...`. Documented the discrepancy with no unnecessary code changes.
