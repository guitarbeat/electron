## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - [Performance Optimization] Stale prompt for movie batch import optimization
The performance task prompt requested optimizing `add_movies` in `api/_lib/stateScopes/movies.ts` by extracting normalized titles into a `Set` to avoid `findMovieByNormalizedTitle(next, movie.title)` O(N^2) search. However, `api/_lib/stateScopes/movies.ts` already contains the `knownNormalizedTitles` `Set` implementation. No code changes were needed.
