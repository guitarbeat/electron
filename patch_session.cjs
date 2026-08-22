const fs = require('fs');
let code = fs.readFileSync('api/session.ts', 'utf8');

const target = `import { jsonResponse, methodNotAllowedResponse } from './_lib/http.js';
import { getSessionState } from './_lib/session.js';
import { getPinCoverageState } from './_lib/state.js';
import { withWebHandler } from './_lib/webHandler.js';
import type { User } from '../apps/web/src/shared/types.js';
import { logger } from './_lib/logger.js';

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
      logger.error('Failed to read PIN coverage for session state.', error);
    }

    return jsonResponse({
      hasAccess: session.hasAccess,
      currentUser: session.currentUser,
      pinProtectedUsers,
      usersMissingPins,
    });
  } catch (error) {
    logger.error(\`Failed to read session state during \${req.method} \${req.url}:\`, error);
    return jsonResponse({
      hasAccess: false,
      currentUser: null,
      pinProtectedUsers: [],
      usersMissingPins: [],
      warning: 'Session state is temporarily unavailable.',
    });
  }
}

export default withWebHandler(handler);`;

const replacement = `import { jsonResponse, methodNotAllowedResponse } from './_lib/http.js';
import { getSessionState } from './_lib/session.js';
import { getPinCoverageState } from './_lib/state.js';
import { withWebHandler } from './_lib/webHandler.js';
import { logger } from './_lib/logger.js';

async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET');
  }

  try {
    const session = getSessionState(req);
    const { pinProtectedUsers, usersMissingPins } = await getPinCoverageState();

    return jsonResponse({
      hasAccess: session.hasAccess,
      currentUser: session.currentUser,
      pinProtectedUsers,
      usersMissingPins,
    });
  } catch (error) {
    logger.error(\`Failed to read session state during GET \${req.url}:\`, error);
    return jsonResponse(
      {
        hasAccess: false,
        currentUser: null,
        pinProtectedUsers: [],
        usersMissingPins: [],
        warning: 'Session state is temporarily unavailable.',
      },
      { status: 500 }
    );
  }
}

export default withWebHandler(handler);`;

code = code.replace(target, replacement);
fs.writeFileSync('api/session.ts', code);
