import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import {
  toWebRequest,
  writeFetchResponse,
  type NodeLikeRequest,
  type NodeLikeResponse,
} from "../../api/_lib/nodeBridge.ts";

const apiRoot = path.resolve(import.meta.dirname, "../../api");

export interface ServerlessRuntimeAdapterOptions {
  allowedOrigins?: string[] | string;
}

export const resolveApiModulePath = (apiPath: string): string => {
  if (apiPath === "/api/agent/v1" || apiPath.startsWith("/api/agent/v1/")) {
    return path.join(apiRoot, "agent.ts");
  }

  const segments = apiPath.split("/").filter(Boolean);
  if (segments[0] === "api" && segments[1] === "state") {
    if (segments.length === 3) {
      return path.join(apiRoot, "state/[scope].ts");
    }
    if (segments.length === 4 && segments[3] === "mutate") {
      return path.join(apiRoot, "state/[scope]/mutate.ts");
    }
  }

  return path.join(apiRoot, `${apiPath.replace(/^\/api\//, "")}.ts`);
};

export const parseAllowedOrigins = (
  configuredOrigins?: string[] | string,
): string[] => {
  if (Array.isArray(configuredOrigins)) {
    return configuredOrigins.map((o) => o.trim()).filter(Boolean);
  }
  if (typeof configuredOrigins === "string" && configuredOrigins.trim()) {
    return configuredOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }

  const envOrigins =
    process.env.ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGINS;
  if (envOrigins && envOrigins.trim()) {
    return envOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }

  return [];
};

export const isOriginAllowed = (
  requestOrigin: string | undefined,
  host: string | undefined,
  allowedOrigins: string[],
): boolean => {
  if (!requestOrigin) return false;

  if (allowedOrigins.length > 0) {
    if (allowedOrigins.includes("*")) return true;
    return allowedOrigins.includes(requestOrigin);
  }

  // Fallback for local development when no explicit ALLOWED_ORIGINS are set:
  // Allow same-origin (http(s)://<host>) and localhost / 127.0.0.1 development origins.
  if (host) {
    if (
      requestOrigin === `http://${host}` ||
      requestOrigin === `https://${host}`
    ) {
      return true;
    }
  }

  try {
    const parsed = new URL(requestOrigin);
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]"
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

export const createServerlessRuntimeAdapter = (
  options: ServerlessRuntimeAdapterOptions = {},
): Plugin => ({
  name: "serverless-runtime-adapter",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/")) return next();

      const rawOrigin = req.headers.origin;
      const requestOrigin = Array.isArray(rawOrigin)
        ? rawOrigin[0]
        : rawOrigin;
      const rawHost = req.headers.host;
      const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;

      const allowedOriginsList = parseAllowedOrigins(options.allowedOrigins);
      const allowed = isOriginAllowed(requestOrigin, host, allowedOriginsList);

      if (allowed && requestOrigin) {
        if (allowedOriginsList.includes("*")) {
          res.setHeader("Access-Control-Allow-Origin", "*");
        } else {
          res.setHeader("Access-Control-Allow-Origin", requestOrigin);
          res.setHeader("Vary", "Origin");
        }
      }

      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS",
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization",
      );

      if (req.method === "OPTIONS") {
        res.statusCode = allowed || !requestOrigin ? 204 : 403;
        return res.end();
      }

      try {
        const filePath = resolveApiModulePath(req.url.split("?")[0]);
        if (!fs.existsSync(filePath)) return next();

        const module = await server.ssrLoadModule(filePath);
        if (typeof module.default !== "function") return next();

        const request = await toWebRequest(req as NodeLikeRequest);
        const response = await module.default(request);
        await writeFetchResponse(res as NodeLikeResponse, response);
      } catch (error) {
        console.error(`[API Error] Failed to execute ${req.url}:`, error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Internal Server Error",
              details:
                error instanceof Error ? error.message : String(error),
            }),
          );
        }
      }
    });
  },
});
