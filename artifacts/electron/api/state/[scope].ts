import { jsonResponse, methodNotAllowedResponse } from '../_lib/http.ts';
import { createReadHandler } from '../_lib/state.ts';
import { withWebHandler } from '../_lib/webHandler.ts';
import { isStateScope } from '../../src/services/state/stateTypes.ts';

const resolveScope = (req: Request): string => {
  // Vercel may pass a relative `req.url` which requires a base.
  const url = new URL(req.url, 'http://localhost');
  const queryScope = url.searchParams.get('scope');
  if (queryScope) return queryScope;

  const segments = url.pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
};

async function handler(req: Request): Promise<Response> {
  const scope = resolveScope(req);

  if (!isStateScope(scope)) {
    if (req.method !== 'GET') {
      return methodNotAllowedResponse('GET');
    }

    return jsonResponse({ error: 'Not found.' }, { status: 404 });
  }

  return createReadHandler(scope)(req);
}

export default withWebHandler(handler);
