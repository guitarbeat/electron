🎯 **What:** Removed the unused export `IOS_BLUE` from `src/components/messages/lib/messageUtils.ts`.
💡 **Why:** `IOS_BLUE` was defined but never imported or used anywhere in the codebase. Removing unused dead code improves maintainability and code readability.
✅ **Verification:** Verified via `grep` that `IOS_BLUE` has no references outside of the file. Tests and types check pass.
✨ **Result:** Cleaned up `messageUtils.ts` by removing unused dead code without altering any functionality.
