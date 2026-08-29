# Original User Request

## 2026-08-29T05:06:12Z

Remediate technical debt, dead code, and performance bottlenecks identified in the engineering audits within `docs/audits/` (CSS dead code & specificity in `CSS_AUDIT.md`, 3D viewport culling in `DRIFTWALL_AUDIT.md`, and static analysis hardening in `LINTING_AUDIT.md`).

Working directory: /Volumes/LoveSSD/electron
Integrity mode: development

## Requirements

### R1. CSS Dead Code Elimination & Specificity Alignment
Prune dead BEM selectors and redundant rules from `apps/web/src/app/component-styles.css` and `globals.css` that have no references in active components as cataloged in `docs/audits/CSS_AUDIT.md`. Prevent specificity collisions with Tailwind utilities while preserving all active design tokens, theme variables, and visual layouts.

### R2. DriftWall Viewport Performance & Subtree Isolation
Implement the performance optimizations specified in `docs/audits/DRIFTWALL_AUDIT.md`, including subtree containment and off-screen tile culling (e.g. `content-visibility: auto`) to minimize style and paint calculations during continuous 3D drift without disrupting infinite modular looping or GPU transform offloading.

### R3. Static Analysis & Type Safety Hardening
Execute the hardening steps outlined in `docs/audits/LINTING_AUDIT.md`: eliminate loose `any` casts in UI primitives, ensure all TypeScript workspaces compile under strict type checking, and enforce zero-warning compliance across the lint pipeline.

## Acceptance Criteria

### Verification & Performance Guardrails
- [ ] `pnpm run check-types` exits with code 0 across all workspaces (`libs`, `api`, `apps/web`).
- [ ] `pnpm run lint` exits with code 0 under strict zero-warning enforcement (`--max-warnings 0`).
- [ ] `pnpm run test` and `pnpm run test:unit` pass all unit and regression test suites.
- [ ] `pnpm run build` succeeds, generating a production client with a reduced CSS bundle payload relative to the initial 143 KB baseline.
- [ ] All primary interactive user flows (3D DriftWall navigation, curved search input, modal overlays, theme switching) remain fully operational without visual or layout regressions.
