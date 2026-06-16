# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot, Antigravity, etc.) when working with code in this repository.

## Repository Overview

Collaborative movie-night app for two people: **React 19**, **TypeScript**, **Vite**, Y2K-inspired UI. Shared state flows through `/api/session` and `/api/state/*`.

Agent workflows and skills live under [`.agents/`](.agents/README.md). Project conventions: [`.agents/guidelines.md`](.agents/guidelines.md).

## OpenCode Integration

OpenCode uses a **skill-driven execution model** powered by the `skill` tool and this repository's [`.agents/skills/`](.agents/skills/) directory.

### Core Rules

- If a task matches a skill, you MUST invoke it
- Skills are located in `.agents/skills/<skill-name>/SKILL.md`
- Project conventions live in [`.agents/guidelines.md`](.agents/guidelines.md)
- Never implement directly if a skill applies
- Always follow the skill instructions exactly (do not partially apply them)

### Intent & Lifecycle Mapping

OpenCode does not support slash commands like `/spec` or `/plan`. Map user intent (and implicit lifecycle phases) to skills:

| Intent / phase | Skill(s) |
|----------------|----------|
| Feature / DEFINE | `spec-driven-development`, then `incremental-implementation`, `test-driven-development` |
| Planning / PLAN | `planning-and-task-breakdown` |
| BUILD | `incremental-implementation` + `test-driven-development` |
| Bug / failure / VERIFY | `debugging-and-error-recovery` |
| Code review / REVIEW | `code-review-and-quality` |
| SHIP | `shipping-and-launch` |
| Refactoring / simplification | `code-simplification` |
| API or interface design | `api-and-interface-design` |
| UI work | `frontend-ui-engineering` |

### Execution Model

For every request:

1. Determine if any skill applies (even 1% chance)
2. Invoke the appropriate skill using the `skill` tool
3. Follow the skill workflow strictly
4. Only proceed to implementation after required steps (spec, plan, etc.) are complete

### Anti-Rationalization

The following thoughts are incorrect and must be ignored:

- "This is too small for a skill"
- "I can just quickly implement this"
- "I’ll gather context first"

Correct behavior:

- Always check for and use skills first

This ensures OpenCode behaves similarly to Claude Code with full workflow enforcement.

## Orchestration: Personas, Skills, and Commands

This repo has three composable layers. They have different jobs and should not be confused:

- **Skills** (`.agents/skills/<name>/SKILL.md`) — workflows with steps and exit criteria. The *how*. Mandatory hops when an intent matches.
- **Personas** (`agents/<role>.md`) — roles with a perspective and an output format. The *who*.
- **Slash commands** (`.claude/commands/*.md`) — user-facing entry points. The *when*. The orchestration layer.

Composition rule: **the user (or a slash command) is the orchestrator. Personas do not invoke other personas.** A persona may invoke skills.

The only multi-persona orchestration pattern this repo endorses is **parallel fan-out with a merge step** — used by `/ship` to run `code-reviewer`, `security-auditor`, and `test-engineer` concurrently and synthesize their reports. Do not build a "router" persona that decides which other persona to call; that's the job of slash commands and intent mapping.

**Claude Code interop:** when `agents/` personas are present, they work as Claude Code subagents (auto-discovered from that directory) and as Agent Teams teammates (referenced by name when spawning). Two platform constraints align with our rules: subagents cannot spawn other subagents, and teams cannot nest. Plugin agents silently ignore the `hooks`, `mcpServers`, and `permissionMode` frontmatter fields.

## Creating a New Skill

See [`.agents/skills/README.md`](.agents/skills/README.md) for directory layout, `SKILL.md` format, script rules, zip packaging, and installation.
