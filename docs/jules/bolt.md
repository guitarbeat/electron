
## 2026-06-24 - [Centralized Logger Abstraction]
- Extracted raw `console.warn` and `console.error` calls into a dedicated `logger` utility for the Electron session API to prevent unhandled raw console logs. This provides a cleaner architecture, allows for unified error tracking in the future (e.g. by wrapping Pino), and sets a standard for logging code health across API files.
