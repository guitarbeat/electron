## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Commented Out Code in `lib/db/src/schema/index.ts`)
Task requested removing commented-out code from `lib/db/src/schema/index.ts:7`, but the file currently contains only `export {};`. Documented the discrepancy with no code changes to `lib/db/src/schema/index.ts`.

## 2026-09-01 - Stale Prompt Discrepancy (IP Spoofing via X-Forwarded-For in `api/agent.ts`)
Task requested fixing `requestIp` in `api/agent.ts:92` to extract the right-most IP from `x-forwarded-for` instead of the first IP. Upon inspecting `api/agent.ts`, the `requestIp` function is already correctly implemented to extract the right-most (proxy-appended) IP from `x-forwarded-for` and all tests in `api/agent.test.ts` pass. Documented the discrepancy with no code changes to `api/agent.ts`.
