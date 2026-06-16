# Scratch workspace

Disposable one-off scripts and draft notes. **Not** durable repo automation.

## Promotion criteria

| Stay in scratch | Promote to `scripts/` | Move to `plans/` or `docs/` |
|-----------------|----------------------|----------------------------|
| Single-session patch runners | Repeatable CI/dev commands | Implementation plans, PR drafts |
| Exploratory test injectors | Migration tooling used more than once | Architecture or feature design notes |

## Current inventory

| File | Disposition |
|------|-------------|
| `patch_*.js`, `patch.cjs`, `patch_app.js` | Historical — target `artifacts/electron/`; do not run without path review |
| `add_tests.py`, `add_complex_tests.py`, `fix_test_imports.py` | Historical test injectors |
| `test_typecheck.js` | One-shot typecheck wrapper |
| `submit.js`, `submission.txt`, `pr_desc.txt` | Disposable PR/submission drafts |
| `ui-prune-plan.md` | Moved to [`plans/ui-prune-plan.md`](../plans/ui-prune-plan.md) |

Plans that outlive a session belong in [`.agents/plans/`](../plans/).

## Path warning

Many scratch scripts reference `artifacts/electron/` from the Replit workspace era. Canonical paths are root `src/` and `api/` — update targets before running any script.
