2025-02-13 - Security: Input Sanitization Renaming
**Vulnerability:** The function `sanitizeInput` was misleadingly named as it only stripped control characters, implying generic safety against injection which it did not provide.
**Fix:** Renamed `sanitizeInput` to `stripControlCharacters` to accurately reflect its behavior. Added `stripHtmlTags` and `escapeHtml` to `config/security.ts` for clearer and more robust sanitization options.
**Learning:** Be explicit with security-related function names. If a function only does partial cleanup, name it accordingly (e.g., `stripControlCharacters`) rather than broadly (e.g., `sanitizeInput`) to prevent misuse.
