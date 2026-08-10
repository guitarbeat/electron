import { serverErrorResponse } from './http.js';
import {
  isWebRequest,
  toWebRequest,
  writeFetchResponse,
  type NodeLikeRequest,
  type NodeLikeResponse,
} from './nodeBridge.js';

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
      console.error(`[webHandler] Fatal error during ${method} ${url}:`, error);

      const response = serverErrorResponse(error);

      if (res) {
        await writeFetchResponse(res, response);
        return;
      }

      return response;
    }
  };

  return dualModeHandler as DualModeHandler;
}
