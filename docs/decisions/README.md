# Architecture Decision Records (ADRs)

This directory contains records of significant architectural, technical, and UX decisions made for the **Electron** platform.

---

## 📋 ADR Index

| ADR ID | Title | Status | Date | Primary Scope |
| :--- | :--- | :---: | :---: | :--- |
| **[`ADR-001`](ADR-001-serverless-isolation-neon-and-tv-ux.md)** | Serverless Dependency Isolation, Neon SSL Normalization & Smart TV Remote UX | **Accepted** | 2026-08-05 | Architecture, Backend, Smart TV |

---

## 🏛️ What is an Architecture Decision Record?

An Architecture Decision Record (ADR) captures a single architectural decision along with its context, considered alternatives, and resulting consequences.

### Status Definitions:
- **Proposed**: Under review and open for team feedback.
- **Accepted**: Decision approved and actively implemented in the codebase.
- **Superseded**: Replaced by a subsequent ADR (referenced in the document header).
- **Deprecated**: No longer relevant or maintained.

---

## 📝 ADR Template

When authoring a new ADR, use the following structure:

```markdown
# ADR-XXX: [Short Descriptive Title]

## Status
[Proposed | Accepted | Superseded by ADR-YYY | Deprecated] — [YYYY-MM-DD]

## Context & Problem Statement
[Describe the problem, architectural forces, technical limitations, or constraints prompting this decision.]

## Decision
[Clearly state the chosen design, approach, or pattern.]

## Rationale & Alternatives Considered
- **Option 1**: [Description & reason rejected/accepted]
- **Option 2**: [Description & reason rejected/accepted]

## Consequences & Verification
- **Positive Impacts**: [Benefits gained]
- **Trade-offs & Risks**: [Known limitations or maintenance costs]
- **Verification Plan**: [Commands or tests validating compliance]
```
