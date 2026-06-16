# AGENTS.md

Entry point for AI coding agents (Cursor, Claude Code, Copilot, OpenCode, etc.).

## Repository overview

Collaborative movie-night app for two people: **React 19**, **TypeScript**, **Vite**, Y2K-inspired UI. Shared state flows through `/api/session` and `/api/state/*`.

## Agent home (`.agents/`)

| Doc | Purpose |
|-----|---------|
| [`.agents/README.md`](.agents/README.md) | Layout: skills, memory, plans, scratch |
| [`.agents/guidelines.md`](.agents/guidelines.md) | Project structure, commands, conventions |
| [`.agents/opencode.md`](.agents/opencode.md) | OpenCode skill-driven execution model |
| [`.agents/orchestration.md`](.agents/orchestration.md) | Personas, skills, slash commands |
| [`.agents/skills/`](.agents/skills/) | Workflow skills (`SKILL.md` per skill) |

**Rule:** if a task matches a skill, invoke it before implementing. See [`.agents/opencode.md`](.agents/opencode.md).

Human docs: [`docs/README.md`](docs/README.md). New skills: [`.agents/skills/README.md`](.agents/skills/README.md).
