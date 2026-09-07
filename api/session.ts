import { jsonResponse, methodNotAllowedResponse } from "./_lib/http.js";
import { getSessionState as defaultGetSessionState } from "./_lib/session.js";
import { getPinCoverageState as defaultGetPinCoverageState } from "./_lib/state.js";
import { withWebHandler } from "./_lib/webHandler.js";
import { logger } from "./_lib/logger.js";

export async function sessionHandler(
  req: Request,
  deps = {
    getSessionState: defaultGetSessionState,
    getPinCoverageState: defaultGetPinCoverageState,
  },
): Promise<Response> {
  if (req.method !== "GET") {
    return methodNotAllowedResponse("GET");
  }

  try {
    const session = deps.getSessionState(req);
    const { pinProtectedUsers, usersMissingPins } = await deps.getPinCoverageState();

    return jsonResponse({
      hasAccess: session.hasAccess,
      currentUser: session.currentUser,
      activeUsers: session.activeUsers,
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

export default withWebHandler(sessionHandler);
