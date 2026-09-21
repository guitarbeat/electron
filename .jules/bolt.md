## CI Discrepancy Note

### Issue
The task prompt requested updating `scripts/maintenance/applied_patches/fix_drift_wall_sync.py` to fix the initial offset calculation string replacement logic to include elapsed time.

### Findings & Actions
1. The requested change in `scripts/maintenance/applied_patches/fix_drift_wall_sync.py` was successfully implemented and verified locally.
2. During CI execution, CI job failures occurred on `src/utils/auth.ts` (type errors regarding `SessionState.token` property) and Node version compatibility for `pnpm` (pnpm v11 requiring Node >= 22.13 in Node 20 job).
3. As instructed by repository guidelines / memories:
   - "If a task prompt references code or snippets that do not exist in the repository (a stale or hallucinated prompt), do not substitute the request by modifying other similar functions."
   - "When encountering pre-existing CI failures during a task, do not make opportunistic, unrelated changes to core configurations (e.g., `.github/workflows/` or `package.json`) to fix them unless explicitly requested. Keep the final submitted patch strictly scoped to the primary intended change."
4. The patch `scripts/maintenance/applied_patches/fix_drift_wall_sync.py` is accurately and cleanly updated per the primary task instructions.

## Task Discrepancy Note: Fix implicit any for MovieSectionBody handle events

### Issue
The task prompt requested fixing implicit any types for MovieSectionBody handle events (`handleRemoveFromList` and `handleMarkWatched`) in `scripts/maintenance/applied_patches/fix_imports.py` and `apps/web/src/components/movies/MoviesView.tsx`.

### Findings & Actions
1. Analyzed `scripts/maintenance/applied_patches/fix_imports.py`, `apps/web/src/components/movies/MoviesView.tsx`, and `apps/web/src/components/movies/MovieSectionBody.tsx`.
2. `scripts/maintenance/applied_patches/fix_imports.py` already contains the logic for handling `MovieSectionBody` event replacements.
3. The event handlers `handleRemoveFromList` and `handleMarkWatched` do not exist in `MoviesView.tsx`, `MovieSectionBody.tsx`, or anywhere else in the React codebase.
4. Per repository memory instructions ("If a task prompt references code or snippets that do not exist in the repository (a stale or hallucinated prompt), do not substitute the request by modifying other similar functions. Conclude the task with no code changes and document the discrepancy..."), concluding the task with no code changes and logging the discrepancy here.

## Task Discrepancy Note: Hardcoded timeout in logger.ts

### Issue
The task prompt requested extracting the hardcoded timeout `1000` in `apps/web/src/services/logger.ts:610` into a named constant.

### Findings & Actions
1. Inspected `apps/web/src/services/logger.ts`.
2. The constant `NAVIGATION_TIMING_DELAY_MS = 1000` is already defined at line 56 and is used in both `document.readyState === "complete"` check and `window.addEventListener("load", ...)` listener.
3. The hardcoded timeout `1000` no longer exists in `apps/web/src/services/logger.ts`.
4. Per repository memory instructions ("If a task prompt references code or snippets that do not exist in the repository (a stale or hallucinated prompt), do not substitute the request by modifying other similar functions. Conclude the task with no code changes and document the discrepancy..."), concluding the task with no code changes to `logger.ts` and logging the discrepancy here.
