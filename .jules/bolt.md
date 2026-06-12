## 2024-06-12 - Initializing Bolt Journal
**Learning:** Initializing journal to track performance optimizations.
**Action:** Always document significant codebase-specific performance insights here.

## 2024-06-12 - N+1 Mutation Bottlenecks
**Learning:** Promise.all loops triggering multiple `mutateScope` calls cause severe N+1 bottlenecks and redundant outbox syncing.
**Action:** Always batch related state updates into a single payload (e.g., `update_memories_batch`) when modifying multiple records simultaneously.
