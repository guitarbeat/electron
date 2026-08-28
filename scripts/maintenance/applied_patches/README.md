# Applied Patches Archive

This directory serves as an archive for maintenance and migration scripts generated during iterative refactoring and monorepo stabilization.

---

## 📋 Directory Purpose

- **Historical Record**: Preserves deterministic code transformations and database migration utilities used during major architectural upgrades (such as service modularization, ADR-001 serverless decoupling, and CSS token normalization).
- **Clean Root Workspace**: Ensures one-off automation scripts do not clutter the repository root or active build pipelines.

---

## ⚠️ Execution Guidelines

- Scripts in this folder are **archived** and are not executed as part of routine CI/CD pipelines (`pnpm verify`) or local development (`pnpm dev`).
- If re-running an archived patch script for debugging or disaster recovery, always execute it in a clean Git working branch and verify changes with `pnpm check-types` and `pnpm test`.
