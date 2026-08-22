const fs = require('fs');
let code = fs.readFileSync('api/agent.ts', 'utf8');

const target = `const publicCatalog = async (resource: string, url: URL, requestId: string): Promise<Response> => {
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
};`;

const replacement = `const publicCatalog = async (resource: string, url: URL, requestId: string): Promise<Response> => {
  let items: any[];
  if (resource === 'movies') {
    items = (await readScopeStoredData('movies', { bypassCache: true })).clientData as any[];
    items = items.map(({ id, title, posterUrl, year, plot, imdbRating, runtime, genre, director, category, mediaType }) =>
      ({ id, title, posterUrl, year, plot, imdbRating, runtime, genre, director, category, mediaType }));
  } else if (resource === 'places') {
    items = (await readScopeStoredData('places', { bypassCache: true })).clientData as any[];
    items = items.map(({ id, name, notes, lat, lng, category, rating, description, imageUrl, visitedAt }) =>
      ({ id, name, notes, lat, lng, category, rating, description, imageUrl, isVisited: Boolean(visitedAt) }));
  } else if (resource === 'suggestions') {
    const movies = (await readScopeStoredData('suggestions', { bypassCache: true })).clientData as any[];
    const places = (await readScopeStoredData('placeSuggestions', { bypassCache: true })).clientData as any[];
    items = [
      ...movies.map(({ id, title, reason, type, status }) => ({ id, kind: 'movie', title, reason, type, status })),
      ...places.map(({ id, name, notes, category, description, status }) => ({ id, kind: 'place', name, notes, category, description, status })),
    ];
  } else return errorResponse(requestId, 404, 'NOT_FOUND', 'Catalog resource not found.');
  
  items.sort((a, b) => {
    const nameA = String(a.title || a.name || a.id || '');
    const nameB = String(b.title || b.name || b.id || '');
    return nameA.localeCompare(nameB);
  });
  
  const result = paginate(items, url);
  return result
    ? responseJson(result, 200, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' })
    : errorResponse(requestId, 422, 'VALIDATION_ERROR', 'page and pageSize must be positive integers; pageSize cannot exceed 100.');
};`;

code = code.replace(target, replacement);

const target2 = `const submitSuggestion = async (request: Request, kind: string, requestId: string): Promise<Response> => {
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
  const input = { ...parsed.data, id: \`agent-\${randomUUID()}\` };
  const result = await mutate(scope, kind === 'movies' ? 'add_suggestion' : 'add_place_suggestion', input, null);
  await recordAgentAudit({ requestId, actor: null, operation: \`submit_\${kind}_suggestion\`, outcome: 'applied' });
  const created = (result.data as unknown[]).at(-1);
  return responseJson({ data: created, requestId }, 201);
};`;

const replacement2 = `const submitSuggestion = async (request: Request, kind: string, requestId: string): Promise<Response> => {
  if (request.method !== 'POST') return errorResponse(requestId, 404, 'NOT_FOUND', 'Route not found.');
  const raw = await readJsonBody(request);
  const schema = kind === 'movies' ? movieSuggestionSchema : kind === 'places' ? placeSuggestionSchema : null;
  if (!schema) return errorResponse(requestId, 404, 'NOT_FOUND', 'Suggestion kind not found.');
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return errorResponse(requestId, 422, 'VALIDATION_ERROR', 'Invalid suggestion.', parsed.error.flatten());
  if (!await consumeAnonymousRateLimit(requestIp(request))) return errorResponse(requestId, 429, 'RATE_LIMITED', 'Too many suggestions. Try again later.');

  const scope = kind === 'movies' ? 'suggestions' : 'placeSuggestions';
  const existing = (await readScopeStoredData(scope, { bypassCache: true })).clientData as any[];
  const candidate = kind === 'movies' ? (parsed.data as { title: string }).title : (parsed.data as { name: string }).name;
  const duplicate = existing.some((item) => {
    const value = kind === 'movies' ? item.title : item.name;
    return typeof value === 'string' && value.trim().toLocaleLowerCase() === candidate.trim().toLocaleLowerCase();
  });
  if (duplicate) return errorResponse(requestId, 409, 'DUPLICATE', 'A matching suggestion already exists.');
  const input = { ...(parsed.data as object), id: \`agent-\${randomUUID()}\` };
  const result = await mutate(scope, kind === 'movies' ? 'add_suggestion' : 'add_place_suggestion', input, null);
  await recordAgentAudit({ requestId, actor: null, operation: \`submit_\${kind}_suggestion\`, outcome: 'applied' });
  const created = (result.data as unknown[]).at(-1);
  return responseJson({ data: created, requestId }, 201);
};`;

code = code.replace(target2, replacement2);
fs.writeFileSync('api/agent.ts', code);
