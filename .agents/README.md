# Agent configuration

Single home for AI agent guidance, skills, memory, plans, scratch work, and session exports.

## Layout

| Path | Purpose |
|------|---------|
| [`guidelines.md`](guidelines.md) | Project structure, commands, and conventions |
| [`skills/`](skills/) | Workflow skills (`SKILL.md` per skill) |
| [`skills-lock.json`](skills-lock.json) | Cursor plugin skill lockfile (paths point at upstream plugins, not this repo) |
| [`memory/`](memory/) | Persistent learnings and architecture notes |
| [`plans/`](plans/) | Saved agent implementation plans |
| [`scratch/`](scratch/) | One-off scripts and draft PR/submission notes |
| [`sessions/`](sessions/) | Exported agent session logs (gitignored) |
| [`agent_assets_metadata.toml`](agent_assets_metadata.toml) | Paintress export metadata pointing at root `DESIGN.md` |

Root [`AGENTS.md`](../AGENTS.md) is the entry point most tools discover automatically; it references this directory.
