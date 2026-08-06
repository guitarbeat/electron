## 2024-05-18 - Handling Meta-Issue Tasks

When assigned a task based on an item from a guideline document or template (e.g., .agents/skills/.../SKILL.md), be very careful not to "solve" the issue by simply editing the template to mark it complete. These are meant to be active checklists. Always verify if there are any *actual* violations in the source code (e.g., real TODO comments). If there are none, the correct action is a no-op.

## 2024-05-18 - GitHub Actions pnpm Setup

When using `pnpm/action-setup@v4` in GitHub Actions, avoid hardcoding the `version` in the workflow file (e.g. `.github/workflows/ci.yml`) if `package.json` already defines it via the `packageManager` field. Specifying conflicting versions causes the setup action to fail with `ERR_PNPM_BAD_PM_VERSION`.
