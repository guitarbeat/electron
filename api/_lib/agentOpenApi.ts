import { AGENT_ACTIONS } from './agentContracts.js';

const errorResponse = {
  description: 'Structured error',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
};

export const buildAgentOpenApiDocument = (origin: string): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: {
    title: 'Electron Agent API',
    version: '1.0.0',
    description: 'Read curated movie-night data, submit suggestions, and—when authorized—operate the shared Electron household app. Destructive and PIN actions require a preview-and-confirm round trip.',
  },
  servers: [{ url: `${origin}/api/agent/v1` }],
  'x-electron-actions': Object.fromEntries(
    Object.entries(AGENT_ACTIONS).map(
      ([name, { description, inputExample }]) => [
        name,
        { description, inputExample },
      ],
    ),
  ),
  paths: {
    '/catalog/{resource}': {
      get: {
        operationId: 'listPublicCatalog',
        description: 'List sanitized public movies, places, or suggestions. Use this for discovery and recommendations; it never returns messages, memories, profile activity, or PIN data.',
        parameters: [
          { name: 'resource', in: 'path', required: true, schema: { type: 'string', enum: ['movies', 'places', 'suggestions'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: { '200': { description: 'Paginated public catalog' }, '422': errorResponse },
      },
    },
    '/suggestions/{kind}': {
      post: {
        operationId: 'submitPublicSuggestion',
        description: 'Submit a pending movie or place suggestion without authentication. Do not use this to modify existing records. Requests are validated, deduplicated, and rate limited.',
        parameters: [{ name: 'kind', in: 'path', required: true, schema: { type: 'string', enum: ['movies', 'places'] } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Suggestion created' }, '409': errorResponse, '422': errorResponse, '429': errorResponse },
      },
    },
    '/private/{scope}': {
      get: {
        operationId: 'readPrivateState',
        security: [{ bearerAuth: [] }],
        description: 'Read an authenticated state scope. Set X-Electron-Actor to Aaron or Electra. PIN values and hashes are never returned.',
        parameters: [
          { name: 'scope', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'X-Electron-Actor', in: 'header', required: true, schema: { $ref: '#/components/schemas/Actor' } },
        ],
        responses: { '200': { description: 'Private state data' }, '401': errorResponse, '422': errorResponse },
      },
    },
    '/actions': {
      post: {
        operationId: 'performHouseholdAction',
        security: [{ bearerAuth: [] }],
        description: 'Perform a typed household action as Aaron or Electra. For delete and PIN actions, first omit confirmationToken, show the returned summary to the user, then repeat the identical actor/action/input with the short-lived token.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ActionRequest' } } },
        },
        responses: { '200': { description: 'Action applied' }, '202': { description: 'Confirmation required' }, '401': errorResponse, '409': errorResponse, '422': errorResponse },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
    schemas: {
      Actor: { type: 'string', enum: ['Aaron', 'Electra'], description: 'Caller-declared actor; the shared household token authorizes either value.' },
      ActionRequest: {
        type: 'object', required: ['actor', 'action', 'input'], additionalProperties: false,
        properties: {
          actor: { $ref: '#/components/schemas/Actor' },
          action: { type: 'string', enum: Object.keys(AGENT_ACTIONS) },
          input: { type: 'object', additionalProperties: true },
          confirmationToken: { type: 'string', description: 'Only send after presenting a confirmation_required summary to the user.' },
        },
        examples: [{ actor: 'Aaron', action: 'addMovie', input: { id: 'movie-example', title: 'Arrival' } }],
      },
      Error: {
        type: 'object', required: ['error'],
        properties: { error: { type: 'object', required: ['code', 'message', 'requestId'], properties: {
          code: { type: 'string' }, message: { type: 'string' }, details: {}, requestId: { type: 'string' },
        } } },
      },
    },
  },
});
