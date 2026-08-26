import { jsonResponse, methodNotAllowedResponse } from "./_lib/http.js";
import { getSessionState } from "./_lib/session.js";
import { getPinCoverageState } from "./_lib/state.js";
import { withWebHandler } from "./_lib/webHandler.js";
import { logger } from "./_lib/logger.js";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return methodNotAllowedResponse("GET");
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
    logger.error(`Failed to read session state during GET ${req.url}:`, error);
    return jsonResponse(
      {
        hasAccess: false,
        currentUser: null,
        pinProtectedUsers: [],
        usersMissingPins: [],
        warning: "Session state is temporarily unavailable.",
      },
      { status: 500 },
    );
  }
}

export default withWebHandler(handler);
