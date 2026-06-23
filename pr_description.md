🎯 **What:** Added comprehensive test coverage for the `scheduleIdleWork` utility in `src/utils/scheduleIdleWork.ts`.
📊 **Coverage:** The tests now cover all key execution paths:
- Node/SSR environment handling (when `window` is `undefined`)
- Ideal path using `window.requestIdleCallback` and `cancelIdleCallback`
- Fallback path using `globalThis.setTimeout` and `clearTimeout`
- Timeout threshold validation (ensuring the requested timeout respects the 400ms limit when falling back)
✨ **Result:** Improved test coverage and deterministic behavioral verification, which acts as a safety net against regressions when refactoring execution scheduling logic.
