## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Commented Out Code in `lib/db/src/schema/index.ts`)
Task requested removing commented-out code from `lib/db/src/schema/index.ts:7`, but the file currently contains only `export {};`. Documented the discrepancy with no code changes to `lib/db/src/schema/index.ts`.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Type Bypassing Casts in api/agent.ts)
Task requested removing type bypassing casts (as any[]) in api/agent.ts:108, but api/agent.ts is already strongly typed using CatalogItem[] and contains no as any[] casts.

## 2026-09-03 - Security Task Discrepancy (Insecure Database Connection Configuration in `api/_lib/dbCommon.ts`)
Task requested updating `createPostgresPool` in `api/_lib/dbCommon.ts:56` to set `rejectUnauthorized` to `true`, but `api/_lib/dbCommon.ts` is already using `{ rejectUnauthorized: true }` and unit tests in `api/_lib/dbCommon.test.ts` verify this behavior. Documented the discrepancy with no additional code changes needed in `api/_lib/dbCommon.ts`.
