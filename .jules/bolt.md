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

## Performance Optimization Task Discrepancy Note

### Issue
Task prompt requested creating a lookup map `remainderMap` before the `CHARACTERS.reduce` loop in `apps/web/src/shared/quizData.ts:342` to replace `rankedRemainders.find(...)`.

### Findings & Actions
1. Inspection of `apps/web/src/shared/quizData.ts` revealed that `remainderMap` (`const remainderMap = new Map(...)`) was already implemented in `normalizeQuizPercentages` at lines 341-353.
2. The code snippet `rankedRemainders.find(...)` referenced in the task prompt does not exist in the repository.
3. Per repository instructions for stale/hallucinated task prompts:
   - Conclude the task with no code changes to `apps/web/src/shared/quizData.ts`.
   - Document the discrepancy in `.jules/bolt.md`.
