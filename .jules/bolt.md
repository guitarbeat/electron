## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - [Code Health] Document Prompt Discrepancy for Leftover Console Log
If a task prompt references `debugSession` or `console.debug` in `apps/web/src/app/providers.tsx` that does not exist in the codebase, document the discrepancy without modifying unrelated code.
