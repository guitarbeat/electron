## 2024-05-23 - [Memoization of List Items]
**Learning:** Extracting list items (like `MovieItem`) into separate memoized components is a low-risk, high-reward optimization for lists that may experience frequent parent re-renders (e.g., from user input or other state changes).
**Action:** When inspecting lists in React, always check if the item rendering is inline. If so, and the list is potentially large or the parent has other state, extract and memoize the item component.
