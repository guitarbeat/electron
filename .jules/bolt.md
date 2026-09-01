## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Discrepancy: `hasAccessSession` is already correctly implemented
The prompt requested fixing an authentication bypass vulnerability in `api/_lib/session.ts` where `hasAccessSession` allegedly unconditionally returned `true`. However, `hasAccessSession` is already correctly implemented to validate session state via `getSessionState(req).hasAccess` and is covered by unit tests. No code changes were needed.
