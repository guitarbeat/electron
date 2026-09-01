## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Commented Out Code in `lib/db/src/schema/index.ts`)
Task requested removing commented-out code from `lib/db/src/schema/index.ts:7`, but the file currently contains only `export {};`. Documented the discrepancy with no code changes to `lib/db/src/schema/index.ts`.

## 2026-09-01 - Stale Prompt Discrepancy (Resolve TODO in SyncBannerContent in `apps/web/src/components/ui/lib/syncBanner.ts:11`)
Task requested resolving a TODO in `SyncBannerContent` and referenced `whatToDo: string;`, but `SyncBannerContent` already uses `recommendedAction: string;` and contains no TODO comment or `whatToDo` property. Documented the discrepancy with no code changes to `apps/web/src/components/ui/lib/syncBanner.ts`.
