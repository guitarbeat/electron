import { serverErrorResponse } from './http.ts';
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

const isDev = process.env.NODE_ENV !== 'production';

const statusEmoji = (status: number): string => {
  if (status < 300) return '✓';
  if (status < 400) return '→';
  if (status < 500) return '✗';
  return '💥';
};

export function withWebHandler(handler: WebHandler): DualModeHandler {
  const dualModeHandler = async (
    req: Request | NodeLikeRequest,
    res?: NodeLikeResponse
  ): Promise<Response | void> => {
    const rawUrl = isWebRequest(req) ? req.url : (req as NodeLikeRequest).url ?? '';
    const method = isWebRequest(req) ? req.method : (req as NodeLikeRequest).method ?? 'GET';
    const pathname = (() => {
      try { return new URL(rawUrl, 'http://localhost').pathname; } catch { return rawUrl; }
    })();
    const start = Date.now();

    try {
      let request: Request;
      let response: Response;

      if (isWebRequest(req) && !res) {
        response = await handler(req);
      } else {
        request = isWebRequest(req) ? req : await toWebRequest(req);
        response = await handler(request);
      }

      if (isDev) {
        const ms = Date.now() - start;
        console.log(`[api] ${statusEmoji(response.status)} ${method} ${pathname} ${response.status} (${ms}ms)`);
      }

      if (!res) {
        return response!;
      }

      await writeFetchResponse(res, response!);
    } catch (error) {
      const ms = Date.now() - start;
      console.error(`[api] 💥 ${method} ${pathname} — fatal error (${ms}ms):`, error);

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
