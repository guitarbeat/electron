import { Router, type IRouter, type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import type { IncomingMessage, ServerResponse } from "node:http";

const router: IRouter = Router();

const toWebRequest = async (req: IncomingMessage & { url?: string; method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown }): Promise<Request> => {
  const host = req.headers.host || "localhost";
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const url = new URL(req.url || "/", `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.body !== undefined) {
      body = JSON.stringify(req.body);
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req as AsyncIterable<Buffer>) {
        chunks.push(Buffer.from(chunk));
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }
  }

  return new Request(url.toString(), {
    method: req.method || "GET",
    headers,
    body,
  });
};

const writeFetchResponse = async (res: ExpressResponse, fetchRes: Response): Promise<void> => {
  res.status(fetchRes.status);
  fetchRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      res.append("Set-Cookie", value);
    } else {
      res.setHeader(key, value);
    }
  });
  const body = await fetchRes.arrayBuffer();
  res.end(Buffer.from(body));
};

const bridgeHandler = (
  handlerFn: (req: Request) => Promise<Response>
) => {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const webReq = await toWebRequest(req as unknown as IncomingMessage & { body?: unknown });
      const webRes = await handlerFn(webReq);
      await writeFetchResponse(res, webRes);
    } catch (err) {
      console.error("API bridge error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};

router.get("/health", async (req, res) => {
  const { default: handler } = await import("../electron-api/handlers/healthHandler.ts");
  await bridgeHandler(handler)(req, res);
});

router.get("/omdb", async (req, res) => {
  const { default: handler } = await import("../electron-api/handlers/omdbHandler.ts");
  await bridgeHandler(handler)(req, res);
});

router.get("/tvmaze", async (req, res) => {
  const { default: handler } = await import("../electron-api/handlers/tvmazeHandler.ts");
  await bridgeHandler(handler)(req, res);
});

router.get("/session", async (req, res) => {
  const { default: handler } = await import("../electron-api/handlers/sessionHandler.ts");
  await bridgeHandler(handler)(req, res);
});

router.post("/session/profile", async (req, res) => {
  const { default: handler } = await import("../electron-api/handlers/sessionProfileHandler.ts");
  await bridgeHandler(handler)(req, res);
});

router.delete("/session/profile", async (req, res) => {
  const { default: handler } = await import("../electron-api/handlers/sessionProfileHandler.ts");
  await bridgeHandler(handler)(req, res);
});

router.get("/state/:scope", async (req, res) => {
  const { default: handler } = await import("../electron-api/handlers/stateReadHandler.ts");
  await bridgeHandler((webReq) => {
    const url = new URL(webReq.url);
    url.searchParams.set("scope", req.params.scope);
    return handler(new Request(url.toString(), { method: webReq.method, headers: webReq.headers }));
  })(req, res);
});

router.post("/state/:scope/mutate", async (req, res) => {
  const { default: handler } = await import("../electron-api/handlers/stateMutateHandler.ts");
  await bridgeHandler(async (webReq) => {
    const url = new URL(webReq.url);
    url.searchParams.set("scope", req.params.scope);
    const body = await webReq.text();
    return handler(new Request(url.toString(), { method: webReq.method, headers: webReq.headers, body }));
  })(req, res);
});

export default router;
