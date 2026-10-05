import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAgentOpenApiDocument } from "./agentOpenApi.js";
import { AGENT_ACTIONS } from "./agentContracts.js";

describe("buildAgentOpenApiDocument", () => {
  it("generates OpenAPI document with specified origin in server URL", () => {
    const origin = "https://household.example.com";
    const doc = buildAgentOpenApiDocument(origin) as any;

    assert.strictEqual(doc.openapi, "3.1.0");
    assert.strictEqual(doc.info.title, "Electron Agent API");
    assert.strictEqual(doc.info.version, "1.0.0");
    assert.ok(typeof doc.info.description === "string");
    assert.deepStrictEqual(doc.servers, [
      { url: "https://household.example.com/api/agent/v1" },
    ]);
  });

  it("handles empty or alternative origin strings correctly", () => {
    const doc1 = buildAgentOpenApiDocument("http://localhost:3000") as any;
    assert.strictEqual(doc1.servers[0].url, "http://localhost:3000/api/agent/v1");

    const doc2 = buildAgentOpenApiDocument("") as any;
    assert.strictEqual(doc2.servers[0].url, "/api/agent/v1");
  });

  it("maps all AGENT_ACTIONS into x-electron-actions with description and inputExample", () => {
    const doc = buildAgentOpenApiDocument("https://example.com") as any;
    const actionsMap = doc["x-electron-actions"];

    assert.ok(actionsMap && typeof actionsMap === "object");
    const expectedKeys = Object.keys(AGENT_ACTIONS);
    assert.deepStrictEqual(Object.keys(actionsMap), expectedKeys);

    for (const [actionName, actionDef] of Object.entries(AGENT_ACTIONS)) {
      const mappedAction = actionsMap[actionName];
      assert.ok(mappedAction, `Missing mapped action for ${actionName}`);
      assert.strictEqual(mappedAction.description, actionDef.description);
      assert.deepStrictEqual(mappedAction.inputExample, actionDef.inputExample);
    }
  });

  it("defines paths with operations and parameters", () => {
    const doc = buildAgentOpenApiDocument("https://example.com") as any;
    const paths = doc.paths;

    assert.ok(paths);
    assert.strictEqual(paths["/catalog/{resource}"].get.operationId, "listPublicCatalog");
    assert.strictEqual(paths["/suggestions/{kind}"].post.operationId, "submitPublicSuggestion");
    assert.strictEqual(paths["/private/{scope}"].get.operationId, "readPrivateState");
    assert.strictEqual(paths["/actions"].post.operationId, "performHouseholdAction");
  });

  it("defines components, securitySchemes, and schemas referencing AGENT_ACTIONS and Actors", () => {
    const doc = buildAgentOpenApiDocument("https://example.com") as any;
    const components = doc.components;

    assert.ok(components);
    assert.deepStrictEqual(components.securitySchemes, {
      bearerAuth: { type: "http", scheme: "bearer" },
    });

    const schemas = components.schemas;
    assert.ok(schemas.Actor);
    assert.deepStrictEqual(schemas.Actor.enum, ["Aaron", "Electra"]);

    assert.ok(schemas.ActionRequest);
    assert.deepStrictEqual(schemas.ActionRequest.properties.action.enum, Object.keys(AGENT_ACTIONS));

    assert.ok(schemas.Error);
    assert.strictEqual(schemas.Error.type, "object");
  });
});
