## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Commented Out Code in `lib/db/src/schema/index.ts`)
Task requested removing commented-out code from `lib/db/src/schema/index.ts:7`, but the file currently contains only `export {};`. Documented the discrepancy with no code changes to `lib/db/src/schema/index.ts`.

## Discrepancy Note: Authentication Bypass in State Scope Retrieval
- **Task Issue:** Reported `hasAccessSession` in `api/_lib/session.ts` unconditionally returning `true` (`void req; return true;`).
- **Codebase Reality:** Investigation confirmed that `hasAccessSession` in `api/_lib/session.ts` already properly validates session access:
  ```typescript
  export const hasAccessSession = (req?: Request): boolean => {
    if (!req) return false;
    return getSessionState(req).hasAccess;
  };
  ```
- **Action:** No code changes were needed because the fix was already implemented and verified by tests.
