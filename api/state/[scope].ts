import { createReadHandler } from "../_lib/stateEngine.js";
import { createStateRouteHandler } from "../_lib/stateRoute.js";
import { withWebHandler } from "../_lib/webHandler.js";

export default withWebHandler(
  createStateRouteHandler({
    method: "GET",
    scopePathOffset: 1,
    createHandler: createReadHandler,
  }),
);
