# Production Deployment & Hosting Runbook

## 1. Architecture & Production Shape

**Electron** is structured for deployment as a static single-page application (SPA) paired with serverless edge/Node.js API handlers:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Vercel Edge Network                    │
 ├──────────────────────────────┬──────────────────────────────┤
 │  Path: /* (Static SPA)       │  Path: /api/* (Serverless)   │
 │  Source: dist/ (Vite Build)  │  Source: api/**/*.ts         │
 └──────────────┬───────────────┴──────────────┬───────────────┘
                │                              │
                ▼                              ▼
        End User Browser            Neon Serverless Postgres
    (React 19, WebGL, 3D Wall)      (Connection Pooler Port 6543)
```

- **Frontend Assets**: Static HTML, JavaScript, CSS, and WebGL shader assets bundled into `dist/`.
- **API Endpoints**: Independent serverless Node ESM functions (`api/*.ts`).
- **Database**: Serverless PostgreSQL instance hosted on Neon (`DATABASE_URL`).

---

## 2. Deploying to Vercel (Canonical Host)

### 2.1. Project Configuration (`vercel.json`)
The repository includes a production-ready `vercel.json` configuration file handling route rewrites:
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/state/:scope/mutate", "destination": "/api/state/[scope]/mutate" },
    { "source": "/api/state/:scope", "destination": "/api/state/[scope]" },
    { "source": "/((?!api/|public/|assets/).*)", "destination": "/index.html" }
  ]
}
```

### 2.2. Setting Up Environment Variables in Vercel
Navigate to **Project Settings > Environment Variables** and configure the following:

| Environment Variable | Recommended Value / Format | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` | Pooled connection string to Neon PostgreSQL. |
| `SESSION_SIGNING_SECRET` | 64-char random hex string (`openssl rand -hex 32`) | Used to sign session cookies and PIN tokens. |
| `AGENT_API_TOKEN` | 64-char base64 string (`openssl rand -base64 48`) | Authorizes private Agent API catalog and action tools. |
| `OMDB_API_KEY` | Hexadecimal API key from omdbapi.com | Enables server-side movie metadata caching. |
| `VITE_GOOGLE_PLACES_API_KEY`| Google Cloud Platform Maps JavaScript / Places API Key | Enables Date Spots map search and previews. |

### 2.3. Deployment CLI Commands
```bash
# Link local repository to the Vercel project
vercel link --project electra-and-aaron-movies

# Pull remote production environment variables locally for testing
vercel env pull .env.local

# Run complete local verification before deploying
pnpm verify

# Deploy directly to production
vercel deploy --prod
```

---

## 3. Database Provisioning & Schema Migration (Neon)

1. **Create a Neon Project**: In the Neon console, create a new PostgreSQL database (AWS `us-east-1` or region closest to your Vercel deployment).
2. **Copy Pooled Connection String**: Ensure you select the **Pooled Connection** string format to utilize PgBouncer on port `6543`.
3. **Automatic Schema Bootstrapping**:
   The application automatically bootstraps required tables on initial connection:
   ```sql
   CREATE TABLE IF NOT EXISTS shared_state_files (
       filename VARCHAR(255) PRIMARY KEY,
       content TEXT NOT NULL,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   ```

---

## 4. Health Checks & Continuous Monitoring

### 4.1. Health Probe Endpoints
The platform exposes `/api/health` for automated uptime monitors and CI sanity checks:

- **Shallow Liveness Probe (`GET /api/health`)**:
  - Checks: Vercel serverless function runtime responsiveness.
  - Recommended Ping Interval: Every 30–60 seconds.
  - Response:
    ```json
    { "ok": true, "liveness": true, "timestamp": "2026-08-28T20:00:00.000Z" }
    ```
- **Deep Readiness Probe (`GET /api/health?deep=1`)**:
  - Checks: Connects to Neon Postgres, validates table existence, and measures read latency.
  - Recommended Ping Interval: Every 5–10 minutes.
  - Response:
    ```json
    {
      "ok": true,
      "liveness": true,
      "database": { "connected": true, "scopeRows": 7, "latencyMs": 24 },
      "timestamp": "2026-08-28T20:00:00.000Z"
    }
    ```

### 4.2. Monitoring Logs & Alerts
- Monitor function error rates and execution times in the Vercel Function Logs.
- Check for spikes in `500` status codes on `/api/state/:scope` endpoints, which indicate database connectivity issues or rate limiting.

---

## 5. Alternative Hosting Targets (Netlify, Docker, Static)

### 5.1. Netlify
- The included `netlify.toml` file builds the static frontend to `dist/`.
- *Important Note*: Netlify deployments require configuring Netlify Functions or proxying `/api/*` requests to an external backend instance running the Node.js API handlers.

### 5.2. Static-Only Hosting (S3 / Cloudflare Pages)
- If deployed to a purely static file host without backend functions:
  - Omit `DATABASE_URL` and API secrets.
  - The frontend will automatically operate in offline fallback mode using `localStorage` and bundled mock datasets.

---

## 6. Pre-Flight Deployment Checklist

- [ ] All unit, typecheck, and lint suites pass cleanly (`pnpm verify`).
- [ ] `DATABASE_URL` is set to the Neon pooled connection URL in Vercel.
- [ ] `SESSION_SIGNING_SECRET` and `AGENT_API_TOKEN` are populated with high-entropy keys.
- [ ] `OMDB_API_KEY` is verified and active.
- [ ] Shallow health probe (`https://YOUR_DOMAIN/api/health`) returns HTTP 200 `{ "ok": true }`.
