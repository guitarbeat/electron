# Contributing

Thank you for contributing to the Collaborative Movie Watchlist!

## Development Setup

1.  **Install dependencies**:

    ```bash
    pnpm install
    ```

2.  **Linting & Formatting**:
    - Run linting: `pnpm run lint`
    - Run formatting: `pnpm run format`
    - Run type checking: `pnpm run check-types`

## Code Style

- **TypeScript/React**: Follows Airbnb style guide with Prettier formatting.

## Pull Requests

- Ensure all checks pass locally.
- CI will run automatically on PRs.

## Jules Workflow

Use this workflow to keep all feature/fix work continuously mergeable into `main`.

1. Start from latest main:

   ```bash
   git checkout main
   git pull --ff-only origin main
   ```

2. Create one branch per task (feature or bugfix) and keep branch names descriptive.

3. Before opening/updating a PR, sync your branch:

   ```bash
   pnpm run jules:sync
   ```

4. Run preflight checks before requesting merge:

   ```bash
   pnpm run jules:preflight
   ```

5. Avoid case-only path variants (for example `.Jules/*` and `.jules/*`). They break merges on macOS/Windows and are blocked by CI.
