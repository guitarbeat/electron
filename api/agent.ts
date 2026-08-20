import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import type { StateScope } from '../artifacts/electron/src/services/state/stateTypes.js';
import type { User } from '../artifacts/electron/src/shared/types.js';
import {
  AGENT_ACTIONS,
  agentActionRequestSchema,
  agentActorSchema,
  isPrivateScope,
  movieSuggestionSchema,
  placeSuggestionSchema,
  type AgentActionName,
} from './_lib/agentContracts.js';
import { buildAgentOpenApiDocument } from './_lib/agentOpenApi.js';
import { consumeAnonymousRateLimit, consumeConfirmation, recordAgentAudit } from './_lib/agentSecurityStore.js';
import { cleanEnvValue } from './_lib/dbCommon.js';
import { mergeHeaders } from './_lib/http.js';
import { patchSharedStateFile } from './_lib/sharedStateStore.js';
import { computeVersion, getScopeDefinition, readScopeStoredData } from './_lib/state.js';
import { withWebHandler } from './_lib/webHandler.js';

const MAX_BODY_BYTES = 32 * 1024;
const CONFIRMATION_TTL_MS = 5 * 60 * 1000;

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
};

const responseJson = (body: unknown, status = 200, headers?: HeadersInit): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: mergeHeaders({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...securityHeaders }, headers),
  });

const errorResponse = (requestId: string, status: number, code: string, message: string, details?: unknown): Response =>
  responseJson({ error: { code, message, ...(details === undefined ? {} : { details }), requestId } }, status);

const readJsonBody = async (request: Request): Promise<unknown> => {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new Error('CONTENT_TYPE');
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  try { return JSON.parse(text); } catch { throw new Error('INVALID_JSON'); }
};

const tokenSecret = (): string => cleanEnvValue(process.env.AGENT_API_TOKEN);

const authenticate = (request: Request): boolean => {
  const configured = tokenSecret();
  const authorization = request.headers.get('authorization') ?? '';
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!configured || !provided) return false;
  const expectedHash = createHash('sha256').update(configured).digest();
  const providedHash = createHash('sha256').update(provided).digest();
  return timingSafeEqual(expectedHash, providedHash);
};

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

interface ConfirmationPayload { id: string; actor: User; action: AgentActionName; digest: string; exp: number }

const signConfirmation = (payload: ConfirmationPayload): string => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', tokenSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};

const verifyConfirmation = (token: string, expected: Omit<ConfirmationPayload, 'id' | 'exp'>): ConfirmationPayload | null => {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature || !tokenSecret()) return null;
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(createHmac('sha256', tokenSecret()).update(encoded).digest('base64url'));
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ConfirmationPayload;
    return payload.exp > Date.now() && payload.actor === expected.actor && payload.action === expected.action && payload.digest === expected.digest
      ? payload : null;
  } catch { return null; }
};

const requestIp = (request: Request): string =>
  (request.headers.get('x-forwarded-for')?.split(',').pop() ?? request.headers.get('x-real-ip') ?? 'unknown').trim().slice(0, 128);

const paginate = (items: unknown[], url: URL): { data: unknown[]; pagination: Record<string, number> } | null => {
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return null;
  const totalItems = items.length;
  return {
    data: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
};

const publicCatalog = async (resource: string, url: URL, requestId: string): Promise<Response> => {
  let items: unknown[];
  if (resource === 'movies') {
    const { clientData } = await readScopeStoredData('movies', { bypassCache: true });
    items = clientData.map(({ id, title, posterUrl, year, plot, imdbRating, runtime, genre, director, category, mediaType }) =>
      ({ id, title, posterUrl, year, plot, imdbRating, runtime, genre, director, category, mediaType }));
  } else if (resource === 'places') {
    const { clientData } = await readScopeStoredData('places', { bypassCache: true });
    items = clientData.map(({ id, name, notes, lat, lng, category, rating, description, imageUrl, visitedAt }) =>
      ({ id, name, notes, lat, lng, category, rating, description, imageUrl, isVisited: Boolean(visitedAt) }));
  } else if (resource === 'suggestions') {
    const movies = (await readScopeStoredData('suggestions', { bypassCache: true })).clientData;
    const places = (await readScopeStoredData('placeSuggestions', { bypassCache: true })).clientData;
    items = [
      ...movies.map(({ id, title, reason, type, status }) => ({ id, kind: 'movie', title, reason, type, status })),
      ...places.map(({ id, name, notes, category, description, status }) => ({ id, kind: 'place', name, notes, category, description, status })),
    ];
  } else return errorResponse(requestId, 404, 'NOT_FOUND', 'Catalog resource not found.');
  items.sort((a, b) => canonical(a).localeCompare(canonical(b)));
  const result = paginate(items, url);
  return result
    ? responseJson(result, 200, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' })
    : errorResponse(requestId, 422, 'VALIDATION_ERROR', 'page and pageSize must be positive integers; pageSize cannot exceed 100.');
};

const mutate = async (scope: StateScope, op: string, input: unknown, actor: User | null): Promise<{ data: unknown; version: string }> => {
  const definition = getScopeDefinition(scope);
  if (!definition.mutate) throw new Error('UNSUPPORTED_ACTION');
  const latest = await readScopeStoredData(scope, { bypassCache: true });
  const result = definition.mutate(latest.stored, op, input, { currentUser: actor, now: new Date().toISOString() });
  if (!result.ok) throw new Error(`CONFLICT:${result.conflict}`);
  const data = definition.toClient(result.data);
  await patchSharedStateFile(definition.filename, definition.serialize(result.data));
  return { data, version: computeVersion(data) };
};

const submitSuggestion = async (request: Request, kind: string, requestId: string): Promise<Response> => {
  if (request.method !== 'POST') return errorResponse(requestId, 404, 'NOT_FOUND', 'Route not found.');
  const raw = await readJsonBody(request);
  const schema = kind === 'movies' ? movieSuggestionSchema : kind === 'places' ? placeSuggestionSchema : null;
  if (!schema) return errorResponse(requestId, 404, 'NOT_FOUND', 'Suggestion kind not found.');
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return errorResponse(requestId, 422, 'VALIDATION_ERROR', 'Invalid suggestion.', parsed.error.flatten());
  if (!await consumeAnonymousRateLimit(requestIp(request))) return errorResponse(requestId, 429, 'RATE_LIMITED', 'Too many suggestions. Try again later.');

  const scope = kind === 'movies' ? 'suggestions' : 'placeSuggestions';
  const existing = (await readScopeStoredData(scope, { bypassCache: true })).clientData;
  const candidate = kind === 'movies' ? (parsed.data as { title: string }).title : (parsed.data as { name: string }).name;
  const duplicate = existing.some((item) => {
    const value = kind === 'movies' ? (item as { title: string }).title : (item as { name: string }).name;
    return value.trim().toLocaleLowerCase() === candidate.trim().toLocaleLowerCase();
  });
  if (duplicate) return errorResponse(requestId, 409, 'DUPLICATE', 'A matching suggestion already exists.');
  const input = { ...parsed.data, id: `agent-${randomUUID()}` };
  const result = await mutate(scope, kind === 'movies' ? 'add_suggestion' : 'add_place_suggestion', input, null);
  await recordAgentAudit({ requestId, actor: null, operation: `submit_${kind}_suggestion`, outcome: 'applied' });
  const created = (result.data as unknown[]).at(-1);
  return responseJson({ data: created, requestId }, 201);
};

const performAction = async (request: Request, requestId: string): Promise<Response> => {
  if (!authenticate(request)) return errorResponse(requestId, 401, 'UNAUTHORIZED', 'A valid household bearer token is required.');
  const parsed = agentActionRequestSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return errorResponse(requestId, 422, 'VALIDATION_ERROR', 'Invalid action request.', parsed.error.flatten());
  const { actor, action, input, confirmationToken } = parsed.data;
  const definition = AGENT_ACTIONS[action];
  const { scope, op } = definition;
  const digest = createHash('sha256').update(canonical({ actor, action, input })).digest('base64url');

  if ('requiresConfirmation' in definition && definition.requiresConfirmation) {
    if (!confirmationToken) {
      const confirmation = signConfirmation({ id: randomUUID(), actor, action, digest, exp: Date.now() + CONFIRMATION_TTL_MS });
      await recordAgentAudit({ requestId, actor, operation: action, outcome: 'confirmation_required' });
      return responseJson({
        status: 'confirmation_required',
        confirmation: { token: confirmation, expiresInSeconds: CONFIRMATION_TTL_MS / 1000, summary: `${actor} requested ${action}. Confirm to apply this action.` },
        requestId,
      }, 202);
    }
    const verified = verifyConfirmation(confirmationToken, { actor, action, digest });
    if (!verified) return errorResponse(requestId, 409, 'INVALID_CONFIRMATION', 'The confirmation is invalid, expired, or does not match this action.');
    if (!await consumeConfirmation(verified.id)) return errorResponse(requestId, 409, 'CONFIRMATION_REPLAYED', 'The confirmation has already been used.');
  }

  try {
    const result = await mutate(scope, op, input, actor);
    await recordAgentAudit({ requestId, actor, operation: action, outcome: 'applied' });
    return responseJson({ data: result.data, requestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const conflict = message.startsWith('CONFLICT:') ? message.slice('CONFLICT:'.length) : null;
    await recordAgentAudit({ requestId, actor, operation: action, outcome: conflict ? 'conflict' : 'failed' }).catch(() => undefined);
    return conflict
      ? errorResponse(requestId, 409, 'CONFLICT', conflict)
      : errorResponse(requestId, 500, 'INTERNAL_ERROR', 'The action could not be completed.');
  }
};

const handler = async (request: Request): Promise<Response> => {
  const requestId = request.headers.get('x-request-id')?.slice(0, 128) || randomUUID();
  const url = new URL(request.url, 'http://localhost');
  const configuredPath = url.searchParams.get('agentPath');
  const path = (configuredPath ?? url.pathname.replace(/^\/api\/agent\/v1\/?/, '')).replace(/^\/+|\/+$/g, '');
  try {
    if (request.method === 'GET' && path === 'openapi.json') {
      return responseJson(buildAgentOpenApiDocument(url.origin), 200, { 'Cache-Control': 'public, max-age=300' });
    }
    if (request.method === 'GET' && path.startsWith('catalog/')) return publicCatalog(path.slice(8), url, requestId);
    if (path.startsWith('suggestions/')) return submitSuggestion(request, path.slice(12), requestId);
    if (request.method === 'GET' && path.startsWith('private/')) {
      if (!authenticate(request)) return errorResponse(requestId, 401, 'UNAUTHORIZED', 'A valid household bearer token is required.');
      const actor = agentActorSchema.safeParse(request.headers.get('x-electron-actor'));
      if (!actor.success) return errorResponse(requestId, 422, 'VALIDATION_ERROR', 'X-Electron-Actor must be Aaron or Electra.');
      const scope = path.slice(8);
      if (!isPrivateScope(scope)) return errorResponse(requestId, 404, 'NOT_FOUND', 'Private scope not found.');
      const { clientData } = await readScopeStoredData(scope, { bypassCache: true });
      await recordAgentAudit({ requestId, actor: actor.data, operation: `read_${scope}`, outcome: 'read' });
      return responseJson({ data: clientData, requestId });
    }
    if (request.method === 'POST' && path === 'actions') return performAction(request, requestId);
    return errorResponse(requestId, 404, 'NOT_FOUND', 'Route not found.');
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'CONTENT_TYPE') return errorResponse(requestId, 422, 'INVALID_CONTENT_TYPE', 'Content-Type must be application/json.');
    if (message === 'BODY_TOO_LARGE') return errorResponse(requestId, 422, 'BODY_TOO_LARGE', `Request body cannot exceed ${MAX_BODY_BYTES} bytes.`);
    if (message === 'INVALID_JSON') return errorResponse(requestId, 422, 'INVALID_JSON', 'Request body must contain valid JSON.');
    console.error(JSON.stringify({ event: 'agent_api_error', requestId, method: request.method, path }));
    return errorResponse(requestId, 500, 'INTERNAL_ERROR', 'The request could not be completed.');
  }
};

export default withWebHandler(handler);
