## 2024-05-23 - Optimistic UI with Gist Backend
**Learning:** Using GitHub Gist as a backend introduces significant latency (~1-3s) due to the read-modify-write cycle enforced by `performMutation`. Standard optimistic UI patterns (update local state immediately) are difficult because `usePolling` controls the state source of truth.
**Action:** When adding items with external dependencies (like metadata), split the operation into two mutations:
1. Immediate "base" mutation (fast, unblocks UI).
2. Background "enrichment" mutation (slow, updates later).
This provides a "perceived instant" experience without architectural overhaul.
