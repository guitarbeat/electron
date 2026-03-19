## electron docs

- **`DEPLOYMENT.md`** – how to run the app locally and deploy it:
  - local dev commands and build checks
  - environment variables (client + serverless)
  - Vercel / Netlify routing and API proxy notes

- **`HISTORY.md`** – narrative project history and regression log:
  - key eras of the product and major architectural shifts
  - regression log with recent fixes and patterns
  - crosswalk from historical paths to current code locations

- **`MAINTENANCE.md`** – ongoing consolidation and simplification plan:
  - current consolidation status (utils, contexts, styles)
  - phased plan for reducing fragmentation
  - working agreement for adding/removing files

Use this folder as follows:
- Start with **`README.md`** → jump to the doc that matches your task.
- If you’re touching infra, CI, or env vars → read **`DEPLOYMENT.md`**.
- If you’re investigating regressions or “how did we get here?” → read **`HISTORY.md`**.
- If you’re refactoring or adding new modules → read **`MAINTENANCE.md`**.

