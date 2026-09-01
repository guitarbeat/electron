## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - [Code Health] Stale prompt reference for `_clearCache`
The task requested removing an unused exported function `_clearCache` in `apps/web/src/services/metadata/index.ts`. However, search across the codebase and git history confirmed that `_clearCache` does not exist in `apps/web/src/services/metadata/index.ts` or anywhere else in the repository. As per memory directives for stale prompts, no code changes were made to the codebase and the discrepancy was documented.
