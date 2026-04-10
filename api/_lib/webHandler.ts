import {
  isWebRequest,
  toWebRequest,
  writeFetchResponse,
  type NodeLikeRequest,
  type NodeLikeResponse,
} from './nodeBridge.ts';

type WebHandler = (req: Request) => Promise<Response> | Response;

type DualModeHandler = {
  (req: Request): Promise<Response>;
  (req: NodeLikeRequest, res: NodeLikeResponse): Promise<void>;
};

export function withWebHandler(handler: WebHandler): DualModeHandler {
  const dualModeHandler = async (
    req: Request | NodeLikeRequest,
    res?: NodeLikeResponse
  ): Promise<Response | void> => {
    try {
      if (isWebRequest(req) && !res) {
        return await handler(req);
      }

      const request = isWebRequest(req) ? req : await toWebRequest(req);
      const response = await handler(request);

      if (!res) {
        return response;
      }

      await writeFetchResponse(res, response);
    } catch (error) {
const url = isWebRequest(req) ? req.url : (req as NodeLikeRequest).url;
      const method = isWebRequest(req) ? req.method : (req as NodeLikeRequest).method;
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      console.error(`[webHandler] Fatal error during ${method} ${url}:`, {
        message,
        stack,
        error,
      });

      if (res) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Internal Server Error',
            message,
            stack: process.env.NODE_ENV === 'development' ? stack : undefined,
          })
        );
        return;
      }

      // If we don't have res, we're in Web mode. Try to return a Response.
      if (typeof Response !== 'undefined') {
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message,
            stack: process.env.NODE_ENV === 'development' ? stack : undefined,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Fatal: no Response, no res. Just rethrow.
      throw error;
    }
  };

  return dualModeHandler as DualModeHandler;
}
