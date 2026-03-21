import { jsonResponse, methodNotAllowedResponse, serverErrorResponse } from './_lib/http.ts';
import { getSessionState } from './_lib/session.ts';
import { getPinProtectedUsers } from './_lib/state.ts';

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowedResponse('GET');
    }

    const session = getSessionState(req);
    const pinProtectedUsers = session.hasAccess
      ? await getPinProtectedUsers()
      : [];

    return jsonResponse({
      hasAccess: session.hasAccess,
      currentUser: session.currentUser,
      pinProtectedUsers,
    });
  } catch (error) {
    console.error('Failed to read session state', error);
    return serverErrorResponse();
  }
}
