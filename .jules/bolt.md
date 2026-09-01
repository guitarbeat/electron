## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - [Security] Stale Prompt Discrepancy for IP Spoofing in api/agent.ts
The task prompt reported an IP spoofing vulnerability in `api/agent.ts` at line 92 (`request.headers.get('x-forwarded-for')?.split(',')[0]`). Inspection of `api/agent.ts` revealed that `requestIp` already extracts the right-most IP from `X-Forwarded-For` (`ips[ips.length - 1]?.trim()`) and falls back to `X-Real-IP`, preventing spoofing. Comprehensive unit tests covering this behavior are present in `api/agent.test.ts`. Per memory instructions, no functional code changes were made.
