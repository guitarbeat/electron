import { jsonResponse, methodNotAllowedResponse, serverErrorResponse } from './_lib/http.ts';
import { getSessionState } from './_lib/session.ts';
import { getPinProtectedUsers } from './_lib/state.ts';
import type { User } from '../src/types.ts';

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowedResponse('GET');
    }

    const session = getSessionState(req);
    let pinProtectedUsers: User[] = [];

    try {
      pinProtectedUsers = await getPinProtectedUsers();
    } catch (error) {
      console.warn('Failed to read pin-protected users for session state.', error);
    }

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
