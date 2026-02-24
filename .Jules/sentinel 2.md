## 2024-05-22 - Client-Side Gist Storage

**Vulnerability:** Hardcoded PAT in `gistConfig.ts` for Gist access.
**Learning:** The app uses GitHub Gists as a backend, requiring a PAT with write access in the client. This is inherently insecure for public deployments but acceptable for private use if the token isn't committed.
**Prevention:** Ensure `VITE_GIST_TOKEN` is used and `gistConfig.ts` checks for its presence.
