## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - [Security] Stale Database SSL Vulnerability Prompt
The issue prompt reported `rejectUnauthorized: false` in `api/_lib/dbCommon.ts`, but inspection of the codebase confirmed that `createPostgresPool` is already securely configured with `rejectUnauthorized: true`. Tests in `api/_lib/dbCommon.test.ts` also verify that `rejectUnauthorized: true` is enforced. No code changes to `dbCommon.ts` were required.
