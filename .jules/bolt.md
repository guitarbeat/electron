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

## Discrepancy Note - Task: Linear Search for Movie in State Scope

### Issue
The task prompt requested optimizing `api/_lib/stateScopes/movies.ts:294`, referencing the following code snippet:
```typescript
        const targetUser = rawTargetUser && isUser(rawTargetUser) ? rawTargetUser : context.currentUser!;

        const target = movies.find((movie) => movie.id === movieId);
        if (!target) {
          return { ok: false, conflict: "Movie not found." };
        }

        return {
          ok: true,
```

### Findings & Actions
1. `movies.find((movie) => movie.id === movieId)` does not exist in `api/_lib/stateScopes/movies.ts`.
2. The index search in `api/_lib/stateScopes/movies.ts` around line 294 already uses `findMovieIndexById(movies, movieId)`, an optimized indexed loop helper function.
3. As mandated by repository guidelines / memory:
   - "If a task prompt references code or snippets that do not exist in the repository (a stale or hallucinated prompt), do not substitute the request by modifying other similar functions. Conclude the task with no code changes and document the discrepancy (e.g., by logging it in `.jules/bolt.md`)."
4. Therefore, no code changes were made to `api/_lib/stateScopes/movies.ts`.
