# Engineering Guidelines: Applying the Pareto Principle (80/20 Rule)

This guide defines how to apply the **Pareto Principle (80/20 Rule)** to product development, systems architecture, performance tuning, and quality assurance within the **Collaborative Movie Night ("Electron")** repository.

---

## 1. Core Philosophy

> **Roughly 80% of outcomes or impacts derive from 20% of causes or inputs.**

The purpose of the 80/20 rule is **not to cut corners or sacrifice craftsmanship**, but to systematically separate the **vital few** high-leverage areas from the **trivial many** distractions. In practice:
- Deliver world-class polish and reliability on the core 20% user loops.
- Avoid over-engineering complex architectures for the 80% long-tail features.

```
  [ 1. Define 80% Outcome ] ──> [ 2. Audit & Attribute ] ──> [ 3. Rank & Isolate Top 20% ]
                                                                       │
  [ 5. Re-baseline & Loop ] <─── [ 4. Execute with Leverage ] <────────┘
```

---

## 2. The 5-Step Pareto Framework

### Step 1: Define the 80% Outcome
Formulate a clear, quantifiable goal for the problem you want to eliminate or the value you want to produce:
- *Product:* "80% of daily active user interactions."
- *Performance:* "80% of initial page load latency and payload size."
- *Stability:* "80% of client sync errors or API timeouts."
- *Storage:* "80% of local storage consumption."

### Step 2: Audit & Collect Objective Data
Do not rely on gut instinct or recency bias. Inspect real signals:
- **Client telemetry & error logs:** Identify the top 2–3 failure modes or crash points.
- **Network payloads:** Inspect bundle analyzer reports and image asset transfer sizes.
- **Database & sync traffic:** Determine which state scopes (`movies`, `places`, `quiz`, `suggestions`) dominate mutations.

### Step 3: Rank & Isolate the Vital 20%
Sort inputs in descending order of impact:
- Isolate the top cluster generating the lion's share of volume.
- Explicitly categorize the remaining items as secondary backlog to prevent focus fragmentation.

### Step 4: Execute with Disproportionate Leverage
Focus 80% of your testing, performance profiling, and design rigor on the vital 20%:
- Ensure the primary path is resilient, offline-capable, and visually responsive.
- Reject unnecessary secondary UI abstractions (e.g. redundant modals or multi-step wizard flows).

### Step 5: Re-baseline Periodically
Once the top 20% issues are resolved, the distribution shifts. A new vital 20% emerges from the remaining backlog. Re-evaluate periodically so you do not optimize past the point of diminishing returns.

---

## 3. Project-Specific Applications in This Repository

### A. Frontend UX & Interactions
* **The Vital 20% (Prioritize):**
  - **The Movie & Place Picker Loop:** Fast swipe/decision interactions, smooth poster loading, and instantaneous optimistic state updates.
  - **Fluid Responsive Shell:** Reliable layout rendering across mobile, desktop, and Smart TV viewports.
* **The Secondary 80% (Keep Lean):**
  - Deep secondary settings, niche filter combinations, and obscure preference toggles.

### B. Storage & Asset Caching (`src/utils/imageCache.ts`)
* **The Vital 20%:**
  - **Poster Blobs:** Movie poster images account for >90% of local IndexedDB storage.
  - **30-Day Expiration & Purge (`cleanupOldImages`):** Purging inactive poster blobs older than 30 days keeps IndexedDB lightweight and prevents device quota exhaustion.
  - **In-Memory Object URL Revocation:** Freeing blob URLs on deletion/cleanup stops memory leaks during prolonged sessions.
* **The Secondary 80%:**
  - Caching tiny text metadata or non-media JSON responses in IndexedDB (local storage or in-memory React state is sufficient).

### C. Serverless API Architecture (`api/` & `.vercelignore`)
* **The Vital 20%:**
  - **Vercel 12-Function Hobby Limit:** Excluding test suites (`api/**/*.test.ts` via `.vercelignore`) prevents test files from counting against function allocation limits.
  - **Consolidated State Routes (`api/_lib/stateRoute.ts`):** Unifying state mutation endpoints into parameterized handlers minimizes serverless function sprawl while serving 100% of state sync.
  - **Bounded Response Cache (`api/_lib/cachedProxy.ts`):** Caching the top 20% most requested external catalog queries shields third-party rate limits and eliminates 80% of upstream network latency.

### D. Testing & Quality Assurance
* **The Vital 20% (High-Rigor Testing):**
  - Core state sync transactions (`stateMutation`, rollback under network failure).
  - Image cache lifecycle (store, retrieve, purge expired blobs, revoke memory URLs).
  - Serverless route handler dispatch and status code enforcement (404, 405).
* **The Secondary 80% (Pragmatic Testing):**
  - Avoid 100% line coverage mandates on static UI boilerplate, trivial getters, or styling classes.

---

## 4. Root Cause Analysis (RCA) Integration

When debugging regressions or operational failures, combine the Pareto Principle with **Toyota's 5 Whys**:

1. **Pareto Filter:** Group reported defects by component or category. Focus investigation exclusively on the category responsible for the highest defect density.
2. **5 Whys Drilldown:** Once the top category is isolated, ask "Why?" iteratively to trace from observable symptom to systemic root cause (rather than patching surface symptoms).
3. **Preventive Action:** Introduce automated unit tests and architectural barriers targeting the root cause to permanently eliminate the defect cluster.

---

## 5. Antipatterns & Common Pitfalls

| Antipattern | Description | Corrective Practice |
| :--- | :--- | :--- |
| **The "Last 20%" Trap** | Assuming the remaining 20% of work takes 20% of time. In reality, edge cases, accessibility, and security hardening take significant effort. | Account for the non-linear tail in production releases. |
| **80/20 as Low Quality** | Using "good enough" as an excuse for sloppy code, missing tests, or broken styles. | Apply 80/20 to **scope selection**, never to craftsmanship. |
| **Mathematical Literalism** | Expecting ratios to equal exactly 80.0% and 20.0%. | Treat 80/20 as a heuristic for **asymmetric leverage** (can be 90/10 or 70/30). |
| **Premature Micro-Optimization** | Spending days tuning utility functions that run in <1ms while leaving uncompressed 3MB images unmanaged. | Profile end-to-end bottlenecks before optimizing. |
