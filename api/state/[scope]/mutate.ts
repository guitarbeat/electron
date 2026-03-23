import { jsonResponse, methodNotAllowedResponse } from '../../_lib/http.ts';
import { createMutateHandler } from '../../_lib/state.ts';
import { isStateScope } from '../../../src/services/stateTypes.ts';

const resolveScope = (req: Request): string => {
  // Vercel may pass a relative `req.url` which requires a base.
  const url = new URL(req.url, 'http://localhost');
  const segments = url.pathname.split('/').filter(Boolean);
  return segments.at(-2) || '';
};

export default async function handler(req: Request): Promise<Response> {
  const scope = resolveScope(req);

  if (!isStateScope(scope)) {
    if (req.method !== 'POST') {
      return methodNotAllowedResponse('POST');
    }

    return jsonResponse({ error: 'Not found.' }, { status: 404 });
  }

  return createMutateHandler(scope)(req);
}
