# Scratch workspace

Disposable one-off scripts and draft notes. **Not** durable repo automation.

## Promotion criteria

| Stay in scratch | Promote to `scripts/` | Move to `plans/` or `docs/` |
|-----------------|----------------------|----------------------------|
| Single-session patch runners | Repeatable CI/dev commands | Implementation plans, PR drafts |
| Exploratory test injectors | Migration tooling used more than once | Architecture or feature design notes |

## Current inventory

| Path | Purpose |
|------|---------|
| `attached_assets/` | Pasted prompts and reference images from agent sessions |

Plans that outlive a session belong in [`.agents/plans/`](../plans/).

## Path warning

Canonical app paths are root `src/` and `api/` (see [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)). Historical Replit workspace copies live under `artifacts/` for reference only.
