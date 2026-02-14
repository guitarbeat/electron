# Contributing

Thank you for contributing to the Collaborative Movie Watchlist!

## Development Setup

1.  **Install dependencies**:

    ```bash
    pnpm install
    ```

2.  **Linting & Formatting**:
    We use ESLint (Airbnb rules), Prettier, Ruff, and Black.
    - Run JS linting: `pnpm run lint`
    - Run JS formatting: `pnpm run format`
    - Run Type checking: `pnpm run check-types`
    - Run Python linting: `ruff check .`
    - Run Python formatting: `black .`

3.  **Pre-commit Hooks**:
    To enable auto-checks before committing:
    ```bash
    pip install pre-commit
    pre-commit install
    ```

## Code Style

- **JavaScript/TypeScript**: Follows Airbnb style guide with Prettier formatting.
- **Python**: Follows Black style and Ruff linting rules.

## Pull Requests

- Ensure all checks pass locally.
- CI will run automatically on PRs.
