## 2025-10-27 - Missing Equality Check in Polling Hook

**Learning:** `usePolling` hook updates state every interval if no equality function is provided, even if data is identical. This causes massive re-renders in consumers like `MessageBoard`. Always check if polled data needs stable references.
**Action:** Add equality check (e.g., `JSON.stringify`) to `usePolling` calls when data comes from an API that returns new references.
