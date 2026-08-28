# Electron Engineering Documentation Hub

Welcome to the central documentation index for **Collaborative Movie Night ("Electron")**. This directory contains architectural specifications, design system tokens, local development guides, deployment runbooks, API contracts, technical audits, and historical records.

---

## 🧭 Documentation Map & Topology

```
docs/
├── README.md                      # Documentation Hub (This File)
│
├── architecture/                  # Core System & Visual Architecture
│   ├── ARCHITECTURE.md            # End-to-end system architecture & state sync
│   ├── DESIGN.md                  # Design tokens, HSL palettes & 3D kinetic specs
│   └── SITE_LAYOUT.md             # Spatial hierarchy, workspaces & modal stacks
│
├── operations/                    # Engineering Workflows & Hosting
│   ├── DEVELOPMENT.md             # Local setup, toolchain & verification guide
│   └── DEPLOYMENT.md              # Production runbook, Vercel & Neon setup
│
├── api/                           # Machine & Developer API Contracts
│   └── AGENT_API.md               # Agent API v1, OpenAPI 3.0 & 2-phase confirmation
│
├── decisions/                     # Architecture Decision Records (ADRs)
│   ├── README.md                  # ADR index, status glossary & template
│   └── ADR-001-...md              # ADR-001: Serverless isolation, Neon SSL & TV UX
│
├── audits/                        # Formal Technical & Performance Audits
│   ├── README.md                  # Audit index, scoring rubrics & methodology
│   ├── DRIFTWALL_AUDIT.md         # 3D DriftWall kinetic canvas & GPU performance
│   ├── CSS_AUDIT.md               # CSS architecture, bundle footprint & specificity
│   └── LINTING_AUDIT.md           # ESLint 9 & TypeScript static analysis audit
│
└── history/                       # Evolutionary Records & References
    ├── HISTORY.md                 # Project timeline, milestones & regression log
    └── YOUWARE.md                 # Technical architecture & stack snapshot
```

---

## 📑 Core Documentation Categories

### 1. 🏛️ Architecture & Product Design (`docs/architecture/`)
| Document | Primary Scope | Target Audience |
| :--- | :--- | :--- |
| **[`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md)** | End-to-end architecture, state sync flow, serverless boundaries, database schemas, and offline resilience. | Systems Architects & Full-Stack Engineers |
| **[`architecture/DESIGN.md`](architecture/DESIGN.md)** | Design tokens, HSL color palettes (Shell, Movies, Places), fluid typography clamps, and 3D kinetic stage parameters. | UI/UX Designers & Frontend Developers |
| **[`architecture/SITE_LAYOUT.md`](architecture/SITE_LAYOUT.md)** | Visual shell hierarchy, workspace layouts (`Watchlist` vs `Date Spots`), modal stacks, and responsive layout rules. | Frontend Developers & UI Engineers |

### 2. 💻 Operations & Deployment (`docs/operations/`)
| Document | Primary Scope | Target Audience |
| :--- | :--- | :--- |
| **[`operations/DEVELOPMENT.md`](operations/DEVELOPMENT.md)** | Local environment setup, Vite dev middleware proxy, toolchain commands (`pnpm verify`), and testing standards. | All Contributors |
| **[`operations/DEPLOYMENT.md`](operations/DEPLOYMENT.md)** | Production runbooks for Vercel, serverless function configurations, environment variables matrix, and health checks. | DevOps & Release Engineers |

### 3. 🤖 API & Integration Contracts (`docs/api/`)
| Document | Primary Scope | Target Audience |
| :--- | :--- | :--- |
| **[`api/AGENT_API.md`](api/AGENT_API.md)** | Machine-to-machine Agent API v1, OpenAPI 3.0.3 specification, authentication, public catalog, and 2-phase confirmation workflow. | LLM Tool Developers & API Consumers |

### 4. 📋 Decisions & Audits (`docs/decisions/` & `docs/audits/`)
| Document | Primary Scope | Target Audience |
| :--- | :--- | :--- |
| **[`decisions/README.md`](decisions/README.md)** | ADR process, status definitions, and index of active Architecture Decision Records. | Engineering Leads & Maintainers |
| **[`decisions/ADR-001`](decisions/ADR-001-serverless-isolation-neon-and-tv-ux.md)** | Record on serverless dependency isolation, Neon connection string normalization, and Smart TV spatial UX. | Systems Architects |
| **[`audits/README.md`](audits/README.md)** | Methodology, scoring criteria, and index of technical audits for DriftWall, CSS, and Linting. | QA & Performance Engineers |

### 5. 📜 Evolution & References (`docs/history/`)
| Document | Primary Scope | Target Audience |
| :--- | :--- | :--- |
| **[`history/HISTORY.md`](history/HISTORY.md)** | Chronological history of milestones, monthly commit breakdown, historical path crosswalks, and comprehensive regression inventory. | Historians & Maintainers |
| **[`history/YOUWARE.md`](history/YOUWARE.md)** | Quick-reference technical snapshot, runtime stack breakdown, and package matrix. | Contributors & Agent Scaffolding |

---

## 🎯 Role-Based Reading Paths

- **New Developer Starting Locally**:
  1. [`operations/DEVELOPMENT.md`](operations/DEVELOPMENT.md) ➔ Setup environment & run `pnpm dev`.
  2. [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) ➔ Understand state sync and serverless architecture.
- **Frontend / UI Engineer**:
  1. [`architecture/DESIGN.md`](architecture/DESIGN.md) ➔ Learn color tokens, typography scales, and 3D stage specs.
  2. [`architecture/SITE_LAYOUT.md`](architecture/SITE_LAYOUT.md) ➔ Explore shell and workspace layouts.
  3. [`audits/DRIFTWALL_AUDIT.md`](audits/DRIFTWALL_AUDIT.md) ➔ Review kinetic 3D math and GPU compositing.
- **DevOps / Infrastructure Engineer**:
  1. [`operations/DEPLOYMENT.md`](operations/DEPLOYMENT.md) ➔ Deploy to Vercel and configure Neon Postgres.
  2. [`decisions/ADR-001`](decisions/ADR-001-serverless-isolation-neon-and-tv-ux.md) ➔ Review connection pooling & SSL configuration.
- **AI Agent / LLM Developer**:
  1. [`api/AGENT_API.md`](api/AGENT_API.md) ➔ Learn OpenAPI 3.0 endpoints and 2-phase confirmation flow.
