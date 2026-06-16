# OpenCode integration

OpenCode uses a **skill-driven execution model** powered by the `skill` tool and [`.agents/skills/`](skills/) in this repository.

## Core rules

- If a task matches a skill, you MUST invoke it
- Skills live at `.agents/skills/<skill-name>/SKILL.md`
- Project conventions: [guidelines.md](guidelines.md)
- Never implement directly if a skill applies
- Always follow the skill instructions exactly (do not partially apply them)

## Intent and lifecycle mapping

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

## Execution model

For every request:

1. Determine if any skill applies (even 1% chance)
2. Invoke the appropriate skill using the `skill` tool
3. Follow the skill workflow strictly
4. Only proceed to implementation after required steps (spec, plan, etc.) are complete

## Anti-rationalization

The following thoughts are incorrect and must be ignored:

- "This is too small for a skill"
- "I can just quickly implement this"
- "I'll gather context first"

Correct behavior: always check for and use skills first.
