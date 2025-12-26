## 2024-02-27 - Unused Import Regression
**Learning:** When refactoring components, especially when removing large chunks of JSX, double-check that you haven't accidentally removed imports that are still used in parts of the code you *didn't* touch (like loading states or error states).
**Action:** Use `grep` or `Find` to verify usage of an imported component before removing it from the import list, or rely on a linter/compiler to flag missing imports before submitting.
