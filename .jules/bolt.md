## 2024-06-09 - O(N^2) state accumulation in loop
**Learning:** Found an O(N^2) issue in React `useEffect` loops over previous state tracking references. Using `find` on `previousMoviesRef.current` within a loop of `movies` causes performance degradation proportional to the square of watchlist size.
**Action:** Replace `.find()` iterations with an O(1) Map pre-computed outside the loop using `for...of` for improved performance without readability sacrifices.
