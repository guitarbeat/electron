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

## Hardcoded Timeout Task Discrepancy

### Issue
The task prompt requested fixing a hardcoded timeout of `800` ms in `apps/web/src/hooks/movies/index.ts:680`.

### Findings
1. Inspection of `apps/web/src/hooks/movies/index.ts` showed that `MOCK_MODE_DELAY_MS = 800` is already defined at line 26.
2. Both timeout calls in `apps/web/src/hooks/movies/index.ts` (lines 634 and 684) already use `MOCK_MODE_DELAY_MS`.
3. As instructed by repository guidelines/memories: "If a task prompt references code or snippets that do not exist in the repository (a stale or hallucinated prompt), do not substitute the request by modifying other similar functions. Conclude the task with no code changes and document the discrepancy."
