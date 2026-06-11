## 2026-06-11 - [O(1) Map Lookup for Collections]
**Learning:** React component `useEffect` hooks that iterate over a state array (like movies) while trying to compare against previous states using `.find()` create an O(N^2) time complexity.
**Action:** When evaluating previous state refs inside a loop, pre-compute a `Map` outside the loop for O(1) lookups to maintain O(N) linear time complexity without sacrificing code readability.
