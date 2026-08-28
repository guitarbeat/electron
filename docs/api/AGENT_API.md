# Electron Agent API Specification (v1)

## 1. Overview & Architectural Role

The **Electron Agent API** provides a standardized, vendor-neutral REST interface for Large Language Models (LLMs) and autonomous agents to interact with Electron.

Unlike browser-facing sync endpoints (`/api/state/*`), the Agent API is designed for machine tool-calling:
- Exposes a machine-readable **OpenAPI 3.0.3 Contract** (`/api/agent/v1/openapi.json`).
- Discovered via `/llms.txt` conventions.
- Implements a secure **Two-Phase Action Confirmation Protocol** for sensitive operations (deletions, modifications, and PIN operations).
- Provides deterministic error schemas with unique correlation `requestId` tracing.

```
 ┌─────────────────────────────────────────────────────────────┐
 │                       AI Agent / LLM                        │
 └──────────────┬──────────────────────────────▲───────────────┘
                │ 1. Discover Schema           │
                │ GET /api/agent/v1/openapi    │
                │                              │
                │ 2. Propose Action            │
                │ POST /api/agent/v1/actions   │
                │ (e.g., deleteMovie)          │
                ▼                              │
 ┌─────────────────────────────────────────────┴───────────────┐
 │               Electron Agent API Gateway                    │
 │                                                             │
 │   Returns HTTP 202 Accepted + Single-Use Confirmation Token │
 └──────────────┬──────────────────────────────▲───────────────┘
                │ 3. Confirm with Human        │
                │    "Shall I delete Arrival?" │
                │                              │
                │ 4. Execute Confirmed Action  │
                │ POST /api/agent/v1/actions   │
                │ { confirmationToken: "..." } │
                ▼                              │
 ┌─────────────────────────────────────────────┴───────────────┐
 │               Neon Postgres Persistence Engine              │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication, Token Rotation & Security

### 2.1. Household Bearer Token (`AGENT_API_TOKEN`)
Private endpoints and action execution require a high-entropy bearer token set in the server environment:

```bash
# Generate a cryptographically secure 64-character bearer token
openssl rand -base64 48
```

- **Server-Only Variable**: Store the value in `AGENT_API_TOKEN` on Vercel.
- **Security Rule**: Never prefix with `VITE_`, commit to source control, or paste into client-side scripts.
- **Immediate Revocation**: Modifying or removing `AGENT_API_TOKEN` instantly revokes all active agent sessions and invalidates outstanding confirmation tokens.

### 2.2. Actor Declaration (`X-Electron-Actor`)
When an agent acts on behalf of a household member, it specifies the identity using the `X-Electron-Actor` header:
- Valid actors: `Aaron` | `Electra`
- The header is recorded in structured audit logs alongside the request correlation ID.

---

## 3. API Contract & Endpoint Catalog

### 3.1. Contract Discovery
- **OpenAPI Schema**: `GET /api/agent/v1/openapi.json`
- **Agent Guide**: `GET /llms.txt`

### 3.2. Public Catalog & Suggestions (Unauthenticated)

#### Browse Movies Catalog
```http
GET /api/agent/v1/catalog/movies?page=1&pageSize=20 HTTP/1.1
Host: your-domain.com
```

#### Submit a Film Suggestion
```http
POST /api/agent/v1/suggestions/movies HTTP/1.1
Host: your-domain.com
Content-Type: application/json

{
  "title": "Arrival",
  "suggestedBy": "Visitor / AI Agent",
  "reason": "Thoughtful science fiction with incredible score."
}
```
*Constraints*: Public suggestions are validated, deduplicated, capped at 32 KiB, and rate-limited to 10 submissions per IP per hour.

---

### 3.3. Private Household Data Reads (Bearer Auth)

```http
GET /api/agent/v1/private/messages HTTP/1.1
Host: your-domain.com
Authorization: Bearer <AGENT_API_TOKEN>
X-Electron-Actor: Aaron
```
*Response*:
```json
{
  "messages": [
    {
      "id": "msg_123",
      "author": "Electra",
      "content": "Are we watching Dune tonight?",
      "timestamp": "2026-08-28T19:30:00.000Z"
    }
  ]
}
```

---

## 4. Two-Phase Action Confirmation Protocol

To protect household data against unintended destructive modifications, destructive actions (e.g. `deleteMovie`, `clearHistory`, `updatePin`) require two-phase execution.

### Phase 1: Propose Action & Receive Confirmation Token
```http
POST /api/agent/v1/actions HTTP/1.1
Host: your-domain.com
Authorization: Bearer <AGENT_API_TOKEN>
Content-Type: application/json

{
  "actor": "Aaron",
  "action": "deleteMovie",
  "input": {
    "movieId": "tt2543164"
  }
}
```

*Response (HTTP 202 Accepted)*:
```json
{
  "status": "REQUIRES_CONFIRMATION",
  "confirmationToken": "cft_98a76f5b4c3d2e1a",
  "expiresAt": "2026-08-28T19:35:00.000Z",
  "summary": "Delete 'Arrival' from the shared movie watchlist."
}
```

### Phase 2: Execute Action with Confirmation Token
The agent presents the summary to the user. Once approved, the agent re-submits the identical payload with the `confirmationToken`:

```http
POST /api/agent/v1/actions HTTP/1.1
Host: your-domain.com
Authorization: Bearer <AGENT_API_TOKEN>
Content-Type: application/json

{
  "actor": "Aaron",
  "action": "deleteMovie",
  "input": {
    "movieId": "tt2543164"
  },
  "confirmationToken": "cft_98a76f5b4c3d2e1a"
}
```

*Response (HTTP 200 OK)*:
```json
{
  "status": "COMPLETED",
  "action": "deleteMovie",
  "result": { "deletedId": "tt2543164", "success": true }
}
```

*Safety Invariants*:
- Tokens expire strictly after **5 minutes**.
- Single-use only: replayed or altered tokens return `HTTP 409 Conflict`.
- Tokens are bound to the original `actor` and `input` parameters.

---

## 5. Standardized Error Response Schema

All errors emitted by the Agent API follow a deterministic structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The supplied movie ID does not exist in the active watchlist.",
    "requestId": "req_88f92a1c0d",
    "timestamp": "2026-08-28T19:30:15.000Z"
  }
}
```

### Common Error Codes
| Code | HTTP Status | Meaning |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | Missing, malformed, or invalid `AGENT_API_TOKEN`. |
| `FORBIDDEN` | 403 | Attempted operation exceeds actor permission boundaries. |
| `RATE_LIMITED` | 429 | IP or token exceeded hourly submission limits. |
| `CONFIRMATION_EXPIRED` | 409 | The 5-minute window for the confirmation token elapsed. |
| `CONFIRMATION_MISMATCH`| 409 | Action parameters do not match original token generation hash. |
| `INTERNAL_ERROR` | 500 | Unhandled server error; correlate using `requestId`. |
