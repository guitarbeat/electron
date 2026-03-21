import {
  badRequestResponse,
  jsonResponse,
  methodNotAllowedResponse,
  mergeHeaders,
  serverErrorResponse,
  unauthorizedResponse,
} from '../_lib/http.ts';
import { buildAccessCookie, hasValidAppSecret } from '../_lib/session.ts';

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowedResponse('POST');
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return badRequestResponse('Invalid JSON payload.');
    }

    const secret =
      typeof (payload as { secret?: unknown }).secret === 'string'
        ? (payload as { secret: string }).secret
        : '';

    if (!secret) {
      return badRequestResponse('App secret is required.');
    }

    if (!hasValidAppSecret(secret)) {
      return unauthorizedResponse('Incorrect app secret.');
    }

    return jsonResponse(
      {
        hasAccess: true,
      },
      {
        headers: mergeHeaders({
          'Set-Cookie': buildAccessCookie(req),
        }),
      }
    );
  } catch (error) {
    console.error('Failed to create access session', error);
    return serverErrorResponse();
  }
}
