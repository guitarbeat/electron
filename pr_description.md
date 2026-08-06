🎯 **What:** Removed the unused export `IOS_BLUE` from `src/components/messages/lib/messageUtils.ts` and fixed CI workflows by removing duplicated pnpm versions.
💡 **Why:**
1. `IOS_BLUE` was defined but never imported or used anywhere in the codebase. Removing unused dead code improves maintainability and code readability.
2. The GitHub CI action was failing due to `ERR_PNPM_BAD_PM_VERSION`, complaining about multiple versions of pnpm being specified (`version: 10.28.1` in the action vs `packageManager: pnpm@10.28.0` in `package.json`). Removing the redundant version explicitly defined in the action lets it correctly derive the required version from `package.json` natively.
✅ **Verification:** Verified via `grep` that `IOS_BLUE` has no references outside of the file. Verified via `pnpm run test` and `pnpm run typecheck` that the code still compiles correctly locally, and reviewed `.github/workflows/ci.yml` syntax manually.
✨ **Result:** Cleaned up `messageUtils.ts` by removing unused dead code without altering any functionality. CI validation actions will now run successfully.
