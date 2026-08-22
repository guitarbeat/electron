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

export const createServerlessRuntimeAdapter = (): Plugin => ({
  name: "serverless-runtime-adapter",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/")) return next();

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
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
          res.end(JSON.stringify({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }));
        }
      }
    });
  },
});
