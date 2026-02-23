## 2025-02-12 - Inconsistent Input Sanitization

**Vulnerability:** Input sanitization was applied in some Hooks (`useMessages`) but missing in Services (`suggestionService`, `memoryService`) and other Hooks (`useMovies` metadata extraction), leading to potential Stored XSS or data integrity issues.

**Learning:** The codebase splits logic between Hooks and Services inconsistently. Some data mutations happen in Hooks (Messages), others in Services (Suggestions, Memories). This led to security controls being applied in one place but forgotten in others.

**Prevention:** Enforce input sanitization at the lowest possible level (the Service layer) for all data ingress points. Ensure all data-handling services import and use `sanitizeInput` before persisting data.

## 2025-02-12 - Node.js Test Environment vs Vite Environment

**Vulnerability:** Testing security controls in Node.js failed because `services/metadataService.ts` accessed `import.meta.env` directly, which is undefined in Node.js, causing tests to crash.

**Learning:** Codebase relies on Vite-specific `import.meta.env` without fallbacks in some files, making unit testing in Node.js difficult.

**Prevention:** Always use a safe accessor for environment variables (e.g., `const env = (import.meta.env || {}) as any;`) or a configuration module that handles environment differences, to ensure code is testable in non-browser environments.

## 2025-02-12 - Unvalidated URL Logic in Hooks

**Vulnerability:** `extractSafeMetadata` in `hooks/useMovies.ts` did not validate `posterUrl`, potentially allowing malicious schemes (e.g., `javascript:`). This logic was buried inside a React Hook, making it hard to test in isolation.

**Learning:** Important business logic (like data sanitization) should not live inside React components or hooks if it doesn't depend on React state/lifecycle.

**Prevention:** Move pure logic to utility functions or services (`services/metadataService.ts`) where it can be unit tested easily with standard tools (`node --test`, `tsx`). Always validate external URLs before use.
