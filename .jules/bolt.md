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

### Hardcoded Timeout Discrepancy Note

- **Task:** Hardcoded timeout in `apps/web/src/hooks/movies/index.ts:425`
- **Requested Code:** `window.setTimeout(resolve, 2000)`
- **Findings:** The code at `apps/web/src/hooks/movies/index.ts:425` was already refactored in a prior update to use `scheduleIdleWork(resolve, AUTO_SYNC_IDLE_DELAY_MS)`, where `AUTO_SYNC_IDLE_DELAY_MS` is extracted as a named constant (`500`).
- **Action:** Per repository guidelines for stale prompts, concluded the task with no code changes to `apps/web/src/hooks/movies/index.ts` and logged the discrepancy here.
