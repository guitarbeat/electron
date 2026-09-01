## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - [Code Health] Stale prompt for _clearCache in metadata service
When given a code health task to remove `_clearCache` from `apps/web/src/services/metadata/index.ts`, investigation showed that `_clearCache` does not exist in the file or anywhere in git history. As per project guidelines for stale/hallucinated prompts, no code changes were made and the task was concluded with documentation of the discrepancy.
