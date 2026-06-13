import { jsonResponse, methodNotAllowedResponse } from '../lib/http.ts';
import { createMutateHandler } from '../lib/state.ts';
import { withWebHandler } from '../lib/webHandler.ts';
import { isStateScope } from '../src/services/state/stateTypes.ts';

const resolveScope = (req: Request): string => {
  // Vercel may pass a relative `req.url` which requires a base.
  const url = new URL(req.url, 'http://localhost');
  const queryScope = url.searchParams.get('scope');
  if (queryScope) return queryScope;

  const segments = url.pathname.split('/').filter(Boolean);
  return segments[segments.length - 2] || '';
};

async function handler(req: Request): Promise<Response> {
  const scope = resolveScope(req);

  if (!isStateScope(scope)) {
    if (req.method !== 'POST') {
      return methodNotAllowedResponse('POST');
    }

    return jsonResponse({ error: 'Not found.' }, { status: 404 });
  }

  return createMutateHandler(scope)(req);
}

export default withWebHandler(handler);
