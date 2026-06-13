import { jsonResponse, methodNotAllowedResponse } from '../lib/http.ts';
import { getSessionState } from '../lib/session.ts';
import { getPinCoverageState } from '../lib/state.ts';
import { withWebHandler } from '../lib/webHandler.ts';
import type { User } from '../src/shared/types.ts';

async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowedResponse('GET');
    }

    const session = getSessionState(req);
    let pinProtectedUsers: User[] = [];
    let usersMissingPins: User[] = [];

    try {
      const pinCoverage = await getPinCoverageState();
      pinProtectedUsers = pinCoverage.pinProtectedUsers;
      usersMissingPins = pinCoverage.usersMissingPins;
    } catch (error) {
      console.warn('Failed to read PIN coverage for session state.', error);
    }

    return jsonResponse({
      hasAccess: session.hasAccess,
      currentUser: session.currentUser,
      pinProtectedUsers,
      usersMissingPins,
    });
  } catch (error) {
    console.error(`Failed to read session state during ${req.method} ${req.url}:`, error);
    return jsonResponse({
      hasAccess: false,
      currentUser: null,
      pinProtectedUsers: [],
      usersMissingPins: [],
      warning: 'Session state is temporarily unavailable.',
    });
  }
}

export default withWebHandler(handler);
