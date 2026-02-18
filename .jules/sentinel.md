## 2024-05-22 - Client-Side Gist Storage

**Vulnerability:** Hardcoded PAT in `gistConfig.ts` for Gist access.
**Learning:** The app uses GitHub Gists as a backend, requiring a PAT with write access in the client. This is inherently insecure for public deployments but acceptable for private use if the token isn't committed.
**Prevention:** Ensure `VITE_GIST_TOKEN` is used and `gistConfig.ts` checks for its presence.

## 2024-05-24 - Unsafe URL Construction in Metadata Service

**Vulnerability:** Manual string concatenation for constructing OMDb and TVMaze API URLs, potentially allowing parameter injection via unencoded ID or Title inputs.
**Learning:** Even internal IDs can contain special characters or be manipulated if they come from untrusted sources (e.g. search results). Relying on manual encoding or assuming safety is risky.
**Prevention:** Always use `URL` and `URLSearchParams` for constructing URLs with dynamic parameters to ensure robust encoding and prevent injection.
