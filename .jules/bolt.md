## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - Stale Prompt Discrepancy (Remove Commented Out Code in `lib/db/src/schema/index.ts`)
Task requested removing commented-out code from `lib/db/src/schema/index.ts:7`, but the file currently contains only `export {};`. Documented the discrepancy with no code changes to `lib/db/src/schema/index.ts`.

## 2026-09-01 - Stale Prompt Discrepancy (Redundant string transformation inside loop in `api/agent.ts`)
Task requested moving candidate string transformation (`candidate.trim().toLocaleLowerCase()`) outside the `some()` loop in `api/agent.ts:161`. Upon inspecting `api/agent.ts`, `candidate.trim().toLocaleLowerCase()` is already hoisted outside the `some()` loop into `normalizedCandidate` at line 449. Documented the discrepancy with no code changes to `api/agent.ts`.
