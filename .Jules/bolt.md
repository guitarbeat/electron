## 2026-08-06 - [⚡ Bolt: Batch Polling on Visibility Change]
Instead of firing all polling functions at once when a tab regains visibility (causing burst network requests), added a batching mechanism that staggers requests in chunks of 5 with a 50ms delay. This maintains UI freshness while preventing uncoordinated request bursts blocking the main thread or hitting rate limits.
