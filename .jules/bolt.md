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

## 2026-09-03 - Security Task Discrepancy (Insecure Database Connection Configuration in `api/_lib/dbCommon.ts`)
Task requested updating `createPostgresPool` in `api/_lib/dbCommon.ts:56` to set `rejectUnauthorized` to `true`, but `api/_lib/dbCommon.ts` is already using `{ rejectUnauthorized: true }` and unit tests in `api/_lib/dbCommon.test.ts` verify this behavior. Documented the discrepancy with no additional code changes needed in `api/_lib/dbCommon.ts`.

## 2026-09-03 - Stale Prompt Discrepancy (Fix implicit any for MovieSectionBody handle events)
Task requested fixing implicit 'any' for MovieSectionBody handle events referenced at scripts/maintenance/applied_patches/fix_imports.py:24, but fix_imports.py already contains these regex transformations and MovieSectionBody.tsx is already strongly typed.

## 2026-09-03 - Stale Prompt Discrepancy (Remove Unused Exported Function `_clearCache` in apps/web/src/services/metadata/index.ts)
Task requested removing unused exported function `_clearCache` from `apps/web/src/services/metadata/index.ts:493`, but `_clearCache` does not exist in `apps/web/src/services/metadata/index.ts` or anywhere in the codebase. Documented the discrepancy with no code changes to source files.

## 2026-09-03 - Stale Prompt Discrepancy (IP Spoofing via X-Forwarded-For in api/agent.ts)
Task requested fixing IP spoofing via X-Forwarded-For in `api/agent.ts:92` by extracting the right-most appended proxy IP instead of the first IP. However, `requestIp` in `api/agent.ts` is already updated and extracts the right-most IP (`ips[ips.length - 1]?.trim()`), and corresponding tests in `api/agent.test.ts` already exist and pass. Documented the discrepancy with no code changes.

## 2026-09-03 - Stale Prompt Discrepancy (Missing tests for cached proxy response builder)
Task requested adding tests for `cachedProxyResponse` in `api/_lib/cachedProxy.ts:66`, but `cachedProxyResponse` (along with `isAbsoluteUrl`, `BoundedResponseCache`, and `jsonProxyResponse`) is already thoroughly tested in `api/_lib/cachedProxy.test.ts`. Documented the discrepancy with no code changes to source/test files needed.

## 2026-09-03 - Stale Prompt Discrepancy (Sequential Await in Promise.all Scope Reading in `api/_lib/state.ts:220`)
Task requested optimizing `bootstrapMissingScopeFiles` in `api/_lib/state.ts:220` by replacing sequential reads with `preloadSharedStateFiles` and parallel reads via `Promise.all`. However, `api/_lib/state.ts` has already been updated in a previous refactor and already executes `await preloadSharedStateFiles(filenames)` followed by `await Promise.all(...)`. Documented the discrepancy with no additional code changes needed.

## 2026-09-04 - Stale Prompt Discrepancy (Missing tests for session API handler in `api/session.ts`)
Task requested adding tests for the session API handler in `api/session.ts:7`, but `api/session.ts` is already comprehensively tested in `api/session.test.ts` (covering non-GET 405 response, unauthenticated state, authenticated state, and 500 error handling). Documented the discrepancy with no code changes needed.
