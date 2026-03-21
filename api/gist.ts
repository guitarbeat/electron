import {
  jsonResponse,
  mergeHeaders,
  methodNotAllowedResponse,
  serverErrorResponse,
} from './_lib/http.ts';

const GONE_MESSAGE =
  'The generic Gist proxy is disabled. Use /api/session and /api/state/:scope instead.';

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: mergeHeaders({
          Allow: 'GET, PATCH, OPTIONS',
        }),
      });
    }

    if (req.method !== 'GET' && req.method !== 'PATCH') {
      return methodNotAllowedResponse('GET, PATCH, OPTIONS');
    }

    return jsonResponse(
      {
        error: GONE_MESSAGE,
      },
      {
        status: 410,
        headers: mergeHeaders({
          Allow: 'GET, PATCH, OPTIONS',
          'Cache-Control': 'no-store',
        }),
      }
    );
  } catch (error) {
    console.error('Failed to handle deprecated /api/gist route', error);
    return serverErrorResponse();
  }
}
