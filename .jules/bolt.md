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

## 2026-09-04 - Stale Prompt Discrepancy (Missing tests for proxy URL validation in `api/_lib/cachedProxy.ts:54`)
Task requested adding tests for proxy URL validation (`isAbsoluteUrl`) in `api/_lib/cachedProxy.ts:54`, but `isAbsoluteUrl` (along with `BoundedResponseCache`, `jsonProxyResponse`, and `cachedProxyResponse`) is already thoroughly tested in `api/_lib/cachedProxy.test.ts`. Documented the discrepancy with no code changes to source/test files needed.

## 2026-09-05 - Stale Prompt Discrepancy (Resolve TODO in SyncBannerContent)
Task requested resolving TODO in SyncBannerContent (`apps/web/src/components/ui/lib/syncBanner.ts:11`), referencing `whatToDo: string`. However, `apps/web/src/components/ui/lib/syncBanner.ts` has already been refactored and contains no TODO comments, and `SyncBannerContent` uses `recommendedAction` instead of `whatToDo`. Documented the discrepancy with no unnecessary source code changes.

## 2026-09-06 - Mechanical Repo Hygiene Enforcement & Automated Storage Cleanup
Implemented automated repository hygiene validator (`scripts/verify-repo-hygiene.mjs`) checking root allowlists, scripts folder boundaries, documentation topology, and source tree purity. Integrated into `npm run verify`. Added automated browser idle cleanup (`requestIdleCallback`) in `apps/web/src/app/App.tsx` calling `cleanupOldImages()` to evict poster blobs older than 30 days from IndexedDB.

## 2026-09-06 - Artifact Lifecycle Compliance Gate (`scripts/check-artifacts.js`)
Created `scripts/check-artifacts.js` and `scripts/pre-commit.sh` to enforce the 4 lifecycle states (Active, Ephemeral, Archived, Deprecated) across root boundaries, runner boundaries, doc topology, and active source directories. Integrated `check-artifacts` into `package.json` scripts (`check-artifacts`, `pre-commit`, `verify`, and `build`), and added mandatory verification steps to the `typecheck-and-lint` and `build` jobs in `.github/workflows/ci.yml`.


## 2026-09-06 - Stale Prompt Discrepancy (N+1 Network Calls in Bulk Metadata Refresh in `apps/web/src/hooks/movies/index.ts:361`)
Task requested optimizing bulk metadata refresh in `apps/web/src/hooks/movies/index.ts:361`. As noted in the rationale and existing `.jules/bolt.md` logs, resolving network-level N+1 calls requires backend architectural changes (> 50 lines), while local movie lookup optimization inside `refreshAllMetadata` using `Set` (`currentMovieIds`) was already completed. Documented the discrepancy with no additional code changes needed.

## 2026-09-06 - Stale Prompt Discrepancy (Missing tests for cached proxy response builder in `api/_lib/cachedProxy.ts:66`)
Task requested adding tests for `cachedProxyResponse` in `api/_lib/cachedProxy.ts:66`. However, `cachedProxyResponse` (along with `isAbsoluteUrl`, `BoundedResponseCache`, and `jsonProxyResponse`) is already comprehensively tested in `api/_lib/cachedProxy.test.ts`. Documented the discrepancy with no code changes to source/test files needed.

## 2026-09-06 - Performance Analysis (Map Iteration for Rate Limit Purge in `api/omdb.ts`)
Analyzed rate limiter eviction logic in `LRURateLimiter` (`api/omdb.ts:40-52`).
Evaluating replacing `for (const [key, value] of this.counts)` with `for (const key of this.counts.keys())` demonstrated that `for..of Map` entries iteration in V8/Node.js directly retrieves key and value in a single loop step without secondary `.get(key)` hash table lookups. Benchmark profiling confirmed `for..of Map` entries iteration performs ~15-42% faster and allocates fewer MapIterator handles than key-iteration with manual lookup. Preserved the optimal `for (const [key, value] of this.counts)` Map iteration pattern without code changes.


## 2026-09-07 - Stale Prompt Discrepancy (Authentication Bypass in State Scope Retrieval in `api/_lib/session.ts:216`)
Task requested fixing an authentication bypass in `hasAccessSession` (`api/_lib/session.ts:216`) where it unconditionally returned `true`. However, `hasAccessSession` is already properly implemented in `api/_lib/session.ts` as `return getSessionState(req).hasAccess;` and is fully tested in `api/_lib/session.test.ts`. Documented the discrepancy with no code changes needed.

## 2026-09-07 - Stale Prompt Discrepancy (Missing tests for health check handler in `api/health.ts:9`)
Task requested adding tests for health check handler in `api/health.ts:9`. However, `api/health.ts` is already comprehensively tested in `api/health.test.ts` (covering OPTIONS 204, non-GET/OPTIONS 405, shallow GET liveness, relative URL handling, deep GET success, and deep GET error/503 status). Documented the discrepancy with no code changes needed.

## 2026-09-08 - Stale Prompt Discrepancy (Remove Leftover Console Log in `apps/web/src/app/providers.tsx`)
Task requested removing leftover console log / debug statement from `apps/web/src/app/providers.tsx:33`, but `apps/web/src/app/providers.tsx` contains no `console.debug` or `debugSession` code. Documented the discrepancy with no code changes needed.

## 2026-09-08 - Stale Prompt Discrepancy (Missing test file for state route handler factory in `api/_lib/stateRoute.ts:24`)
Task requested adding a test file for `createStateRouteHandler` in `api/_lib/stateRoute.ts:24`. However, `api/_lib/stateRoute.ts` is already fully tested in `api/_lib/stateRoute.test.ts`, covering query parameters, path offset resolution, trailing/multiple slashes, invalid scopes, 404 vs 405 response flows, method mismatches, all valid `STATE_SCOPES`, and request object forwarding. Documented the discrepancy with no additional code changes needed.

## 2026-09-08 - Stale Prompt Discrepancy (Missing tests for configuration resolver in `api/_lib/config.ts:9`)
Task requested adding tests for configuration resolver (`resolveConfig`) in `api/_lib/config.ts:9`. However, `resolveConfig` is already comprehensively tested in `api/_lib/config.test.ts` (covering valid values, leading/trailing whitespace, newlines/tabs, undefined, empty string, whitespace-only, and empty fallback values). Documented the discrepancy with no code changes needed.

## 2026-09-08 - Stale Prompt Discrepancy (Missing tests for health check handler in `api/health.ts:9`)
Task requested adding tests for health check handler in `api/health.ts:9`. However, `api/health.ts` is already comprehensively tested in `api/health.test.ts` with 10 test cases (covering OPTIONS 204, non-GET/OPTIONS 405, shallow GET liveness, relative URL handling, deep GET success with mock dependencies, default dependencies fallback, deep GET 503 error handling, non-Error exception handling, and default export withWebHandler wrapper). Documented the discrepancy with no code changes needed.

## 2026-09-08 - Stale Prompt Discrepancy (Remove Type Bypassing Casts in api/agent.ts:108)
- Task Details referenced `api/agent.ts:108` with snippet:
  `let items: any[]; if (resource === "movies") { items = (await readScopeStoredData("movies", { bypassCache: true })).clientData as any[];`
- Upon inspection of `api/agent.ts`, line 108 is `return timingSafeEqual(expectedHash, providedHash);`.
- No such code snippet exists in `api/agent.ts` or elsewhere in the codebase.
- As per memory instructions, concluding the task with no code changes and documenting the discrepancy.

## 2026-09-08 - Stale Prompt Discrepancy (Sequential Await in Promise.all Scope Reading in `api/_lib/state.ts:220`)
- Task requested optimizing `bootstrapMissingScopeFiles` in `api/_lib/state.ts:220` by replacing sequential reads with `preloadSharedStateFiles` and parallel reads via `Promise.all`.
- Upon inspecting `bootstrapMissingScopeFiles` in `api/_lib/state.ts`, the function already calls `await preloadSharedStateFiles(filenames)` followed by `await Promise.all(...)`.
- As per memory instructions, concluded the task with no additional code changes and documented the discrepancy.


## 2026-09-08 - Stale Prompt Discrepancy (Inefficient Map Iteration for Rate Limit Purge in api/omdb.ts:54)
- Task details referenced `api/omdb.ts:54` with a code snippet: `if (!record || now > record.resetTime) { if (ipRequestCounts.size >= MAX_RATE_LIMIT_ENTRIES) { for (const [key, value] of ipRequestCounts.entries()) ... while (ipRequestCounts.size >= MAX_RATE_LIMIT_ENTRIES) ...`
- Upon inspection of `api/omdb.ts`, this standalone snippet does not exist. `api/omdb.ts` uses an `LRURateLimiter` class wrapping `counts` (`Map<string, { count: number; resetTime: number }>`).
- The rate limiter eviction loop in `LRURateLimiter.isRateLimited` already uses `for (const [key, value] of this.counts)`, which is the optimal Map iteration pattern in V8.
- Documented the discrepancy with no source code changes needed.

## 2026-09-09 - Stale Prompt Discrepancy (N+1 Mutation Operations in Promise.all in `apps/web/src/hooks/movies/index.ts:380`)
- Task requested refactoring `refreshAllMetadata` in `apps/web/src/hooks/movies/index.ts:380` to a single batched mutation to eliminate network-level N+1 calls.
- Analyzing the backend mutation API (`api/_lib/stateScopes/movies.ts`) confirmed that the backend only supports `update_metadata` per single `movieId` payload (batching `update_metadata` is not supported in the backend state engine or agent contracts).
- Local movie ID lookup optimization using `Set` (`currentMovieIds`) in `refreshAllMetadata` was previously completed.
- As per memory directives, concluded the task with no source code changes and documented the discrepancy.

## 2026-09-09 - Stale Prompt Discrepancy (Virtualized List in `src/`)
- Task requested updating "the main list component in src/ to use a virtualized list container" instead of a single scrollable container, to improve performance while "preserving the existing card layout and filtering behavior".
- Inspecting `apps/web/src/components/movies/MovieSectionBody.tsx`, the movie list is exclusively rendered using `<DriftWall />`, which is a complex, 3D animated continuous-scrolling physics layout.
- Replacing `<DriftWall />` with a standard 2D virtualized list component (e.g. `@tanstack/react-virtual` or `react-window`) causes a severe UI/UX regression, explicitly violating the requirement to "Do NOT change functionality" and "preserve the existing card layout". Code review rejected the change on this basis.
- The 3D continuous loop physics of `<DriftWall />` uses translated CSS columns and cannot be adapted to standard 2D windowed virtualization without fundamentally rewriting the physics engine. No standard 2D list component exists in the codebase to replace or virtualize instead.
- As per memory directives, concluded the task with no source code changes and documented the discrepancy.

## 2026-09-12 - Stale Prompt Discrepancy (Hardcoded Timeout in `apps/web/src/services/logger.ts:607`)
- Task requested extracting hardcoded timeout `1000` into a named constant at `apps/web/src/services/logger.ts:607`.
- Inspection of `apps/web/src/services/logger.ts` revealed that `NAVIGATION_TIMING_DELAY_MS = 1000` constant (line 56) has already been extracted and is being used in `setTimeout(collectNavigationTiming, NAVIGATION_TIMING_DELAY_MS)` at lines 608 and 611.
- Concluded task with no code changes needed and documented the discrepancy.
