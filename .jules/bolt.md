# Bolt's Journal

CRITICAL LEARNINGS ONLY.

Format: `## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]`

## 2026-02-21 - Static Import Bottleneck in App.tsx
**Learning:** Heavy components (QuizFlow, QuizEditor, ExtrasHub) were statically imported in `App.tsx`, causing unnecessary bundle bloat on initial load.
**Action:** Always check `App.tsx` for heavy static imports and refactor to `React.lazy` where appropriate.
