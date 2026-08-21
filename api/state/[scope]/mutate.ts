import { createMutateHandler } from '../../_lib/stateEngine.js';
import { createStateRouteHandler } from '../../_lib/stateRoute.js';
import { withWebHandler } from '../../_lib/webHandler.js';

export default withWebHandler(
  createStateRouteHandler({
    method: 'POST',
    scopePathOffset: 2,
    createHandler: createMutateHandler,
  }),
);
