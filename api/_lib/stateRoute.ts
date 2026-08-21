import { isStateScope, type StateScope } from '../../artifacts/electron/src/services/state/stateTypes.js';
import { jsonResponse, methodNotAllowedResponse } from './http.js';

type StateRequestHandler = (request: Request) => Promise<Response> | Response;

interface StateRouteOptions {
  method: 'GET' | 'POST';
  scopePathOffset: 1 | 2;
  createHandler: (scope: StateScope) => StateRequestHandler;
}

const resolveScope = (request: Request, pathOffset: number): string => {
  const url = new URL(request.url, 'http://localhost');
  const queryScope = url.searchParams.get('scope');
  if (queryScope) return queryScope;

  const segments = url.pathname.split('/').filter(Boolean);
  return segments[segments.length - pathOffset] || '';
};

export const createStateRouteHandler = ({
  method,
  scopePathOffset,
  createHandler,
}: StateRouteOptions): StateRequestHandler =>
  async (request) => {
    const scope = resolveScope(request, scopePathOffset);

    if (!isStateScope(scope)) {
      if (request.method !== method) {
        return methodNotAllowedResponse(method);
      }
      return jsonResponse({ error: 'Not found.' }, { status: 404 });
    }

    return createHandler(scope)(request);
  };
