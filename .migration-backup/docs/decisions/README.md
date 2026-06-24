# Architecture Decision Records

Lightweight ADRs for durable decisions that outgrow informal [`.agents/memory/`](../.agents/memory/MEMORY.md) notes.

## Index

| ADR | Status | Summary |
|-----|--------|---------|
| *(none yet)* | — | Add rows as decisions are recorded |

## Template

Copy into `docs/decisions/NNNN-short-title.md`:

```markdown
# NNNN: Title

**Status:** proposed | accepted | deprecated | superseded by NNNN
**Date:** YYYY-MM-DD

## Context

What problem or constraint triggered this decision?

## Decision

What we chose and why.

## Consequences

Positive, negative, and follow-up work.
```

## When to write an ADR

- A choice affects multiple modules or deployment shape
- Reversing it later would be costly
- Agents and humans will disagree without a written record

For tactical debugging notes and UI invariants, keep using `.agents/memory/` and link here when a note graduates to a durable decision.
