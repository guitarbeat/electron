## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Commented Out Code in `lib/db/src/schema/index.ts`)
Task requested removing commented-out code from `lib/db/src/schema/index.ts:7`, but the file currently contains only `export {};`. Documented the discrepancy with no code changes to `lib/db/src/schema/index.ts`.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Type Bypassing Casts in api/agent.ts)
Task requested removing type bypassing casts (as any[]) in api/agent.ts:108, but api/agent.ts is already strongly typed using CatalogItem[] and contains no as any[] casts.

## 2026-09-03 - N+1 Network Calls in Bulk Metadata Refresh
Task requested optimizing bulk metadata refresh in `apps/web/src/hooks/movies/index.ts:361`. While full elimination of network N+1 calls requires backend endpoint changes (> 50 lines), optimized local JavaScript movie lookup inside `refreshAllMetadata` by constructing a Set (`currentMovieIds`) before filtering, reducing array membership checks from O(N^2) to O(N).

## 2026-09-03 - Stale Prompt Discrepancy (Remove Leftover Console Log in `apps/web/src/app/providers.tsx`)
Task requested removing leftover console log / debug statement from `apps/web/src/app/providers.tsx:33`, but the file contains no `console.debug` or `debugSession` code. Documented the discrepancy with no code changes to `apps/web/src/app/providers.tsx`.

## 2026-09-03 - Stale Prompt Discrepancy (Fix initial offset calculation in fix_drift_wall_sync.py)
Task requested fixing the initial offset calculation in `scripts/maintenance/applied_patches/fix_drift_wall_sync.py:13` to include elapsed time in `apps/web/src/components/ui/DriftWall.tsx`. However, `apps/web/src/components/ui/DriftWall.tsx` was already updated in a previous refactor and no longer contains the target code pattern `(_, i) => offsetsRef.current[i] ?? ...`. Documented the discrepancy with no unnecessary code changes.

## 2026-09-12 - Stale Prompt Discrepancy (Insecure Database Connection Configuration in `api/_lib/dbCommon.ts:56`)
- Task requested setting `rejectUnauthorized` to `true` or providing proper CA certificates in `api/_lib/dbCommon.ts:56` where it claimed `rejectUnauthorized` was set to `false`.
- Inspection of `api/_lib/dbCommon.ts:68` showed `poolConfig.ssl = { rejectUnauthorized: true };` is already configured with `rejectUnauthorized: true`.
- Tests in `api/_lib/dbCommon.test.ts` verify `rejectUnauthorized: true` configuration.
- As per memory instructions, concluding the task with no source code changes and documenting the discrepancy.
