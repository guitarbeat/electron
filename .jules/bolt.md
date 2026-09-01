## 2026-08-20 - [Code Health] Remove non-platform agnostic copy
When addressing code health tasks on UI copy, prefer platform-agnostic verbs like 'select' or 'choose' instead of 'tap' or 'click' unless it explicitly refers to a desktop-only or mobile-only element.

## 2026-09-01 - [Code Health] Stale Task Prompt Discrepancy in `api/agent.ts`
The task prompt requested removing type-bypassing `any[]` casts in `api/agent.ts` line 108 (`let items: any[]`). Inspection of `api/agent.ts` confirmed that `items` is already strongly typed as `CatalogItem[]` with proper interfaces (`CatalogMovieItem`, `CatalogPlaceItem`, `CatalogMovieSuggestionItem`, `CatalogPlaceSuggestionItem`) and no `any[]` casts exist. No code changes to `api/agent.ts` were needed.
