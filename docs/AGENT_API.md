# Electron Agent API

The vendor-neutral Agent API lets tool-calling LLMs read a curated catalog,
submit suggestions, and—when explicitly authorized—operate Electron. It is
separate from the browser-oriented `/api/state/*` protocol.

## Configure and rotate the household token

Generate a high-entropy token locally:

```sh
openssl rand -base64 48
```

Set the result as the server-only `AGENT_API_TOKEN` in Vercel. Never prefix it
with `VITE_`, place it in source control, or paste it into an LLM conversation.
After changing the value, redeploy the project. Rotation immediately invalidates
the old token and any outstanding confirmation tokens. To revoke agent access,
remove `AGENT_API_TOKEN` and redeploy.

Production also requires `DATABASE_URL`. Anonymous rate limits, consumed
confirmation IDs, and audit events are stored in Postgres. Local development
without Postgres uses process-local storage and must not be treated as durable.

## Discover the contract

```sh
curl -sS https://YOUR_HOST/api/agent/v1/openapi.json
curl -sS 'https://YOUR_HOST/api/agent/v1/catalog/movies?page=1&pageSize=20'
```

The OpenAPI description is the source of truth for action names, authentication,
inputs, errors, and the confirmation flow. `/llms.txt` links agents to it.

## Submit a public suggestion

```sh
curl -sS -X POST https://YOUR_HOST/api/agent/v1/suggestions/movies \
  -H 'Content-Type: application/json' \
  --data '{"title":"Arrival","suggestedBy":"Visitor","reason":"Thoughtful science fiction"}'
```

Public writes can only create pending movie or place suggestions. They are
validated, deduplicated, capped at 32 KiB, and limited to 10 submissions per IP
per hour.

## Read private data

```sh
curl -sS https://YOUR_HOST/api/agent/v1/private/messages \
  -H "Authorization: Bearer $ELECTRON_AGENT_TOKEN" \
  -H 'X-Electron-Actor: Aaron'
```

The token authorizes both household profiles. `X-Electron-Actor` records the
caller-declared actor; it does not cryptographically prove who spoke to the LLM.
PIN values and hashes are never readable.

## Apply and confirm actions

Non-destructive action:

```sh
curl -sS -X POST https://YOUR_HOST/api/agent/v1/actions \
  -H "Authorization: Bearer $ELECTRON_AGENT_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"actor":"Aaron","action":"addMessage","input":{"content":"Movie at 8?"}}'
```

Delete and PIN actions first return HTTP 202 with a five-minute confirmation
token. Present the returned summary to the person, then repeat the identical
`actor`, `action`, and `input` with `confirmationToken`. Tokens are single-use;
altered, expired, actor-mismatched, and replayed confirmations return HTTP 409.

## Errors and operations

Errors have one stable shape:

```json
{"error":{"code":"VALIDATION_ERROR","message":"Invalid action request.","requestId":"..."}}
```

Use `requestId` to correlate an error with structured server logs. Audit rows
record request ID, declared actor, operation, outcome, and timestamp; they never
store request bodies, bearer tokens, or PINs.
