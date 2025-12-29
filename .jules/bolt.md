## 2024-05-24 - Playwright Strict Mode & Toasts
**Learning:** Playwright's `get_by_text` is strict by default. When verifying an action that triggers a Toast notification containing the same text as the created item (e.g., "Movie X added"), the test will fail with a "strict mode violation" because it finds both the item in the list and the success message.
**Action:** Use more specific locators like `get_by_role("heading", name="...")` for the item, or explicitly scope the search to the list container. Also, success toasts are a great way to verify actions, but they can interfere with simple text assertions.

## 2024-05-24 - Bypassing Intro Screens in Tests
**Learning:** For apps with "Intro" or "Quiz" screens controlled by localStorage, injecting `localStorage.setItem` via `context.add_init_script` in Playwright is far more robust than trying to click "Skip" buttons that might be animating or slow to render.
**Action:** Always check for client-side persistence flags and inject them in test setup to fast-forward to the relevant state.
