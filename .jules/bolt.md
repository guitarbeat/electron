# Jules / Bolt Development Notes

## 2026-08-21 - Stale Performance Target Analysis

- **Observation**: A previous prompt requested a performance optimization in `src/components/memories/lib/memoryUtils.ts` referencing `MovieMemorySummary` and `getFallbackMovieKey`.
- **Finding**: The referenced utilities and paths were already refactored during the Era 6 service consolidation into `apps/web/src/components/movies/` and `apps/web/src/services/`.
- **Resolution**: Identified the prompt as stale relative to the active monorepo directory layout.
