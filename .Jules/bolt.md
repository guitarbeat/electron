## 2026-06-23 - [Security] Enforce SESSION_SIGNING_SECRET
When addressing missing environment configurations for cryptographic secrets, do not fallback to generating ephemeral random secrets using `crypto.randomBytes()`. Ephemeral secrets silently degrade horizontal scaling and session stability across restarts. Instead, enforce strict validation and fail fast by throwing an error, ensuring developers are forced to provide a stable, secure secret before the application starts.

## 2024-06-14 - Test concurrentMap
Testing concurrency logic can be tricky. It is useful to use promises to 'hang' worker threads to carefully assert the maximum active concurrent tasks logic.

## 2026-06-24 - [Centralized Logger Abstraction]
- Extracted raw `console.warn` and `console.error` calls into a dedicated `logger` utility for the Electron session API to prevent unhandled raw console logs. This provides a cleaner architecture, allows for unified error tracking in the future (e.g. by wrapping Pino), and sets a standard for logging code health across API files.
