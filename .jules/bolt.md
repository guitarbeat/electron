## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Commented Out Code in `lib/db/src/schema/index.ts`)
Task requested removing commented-out code from `lib/db/src/schema/index.ts:7`, but the file currently contains only `export {};`. Documented the discrepancy with no code changes to `lib/db/src/schema/index.ts`.

## 2026-09-02 - Stale Prompt Discrepancy (Remove Leftover Console Log in `apps/web/src/app/providers.tsx`)
Task requested removing a leftover console log (`debugSession` check) from `apps/web/src/app/providers.tsx:33`, but `apps/web/src/app/providers.tsx` does not contain any `debugSession` or `console.debug` statements. Documented the discrepancy with no code changes to `apps/web/src/app/providers.tsx`.
