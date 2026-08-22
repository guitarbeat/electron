import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

const serverlessEntries = [
  "api/health.ts",
  "api/omdb.ts",
  "api/session.ts",
  "api/session/profile.ts",
  "api/state/[scope].ts",
  "api/state/[scope]/mutate.ts",
  "api/tvmaze.ts",
];

const runtimeImportPattern =
  /(?:import|export)\s+(?!type\b)(?:[^"']*?\sfrom\s*)?["']([^"']+)["']/g;

const resolveSourceImport = (importer: string, specifier: string): string => {
  const absoluteSpecifier = resolve(dirname(importer), specifier);
  const candidates = extname(absoluteSpecifier)
    ? [absoluteSpecifier.replace(/\.js$/, ".ts"), absoluteSpecifier]
    : [
        `${absoluteSpecifier}.ts`,
        `${absoluteSpecifier}.tsx`,
        join(absoluteSpecifier, "index.ts"),
        join(absoluteSpecifier, "index.tsx"),
      ];

  const resolved = candidates.find(existsSync);
  assert.ok(resolved, `${specifier} imported by ${importer} does not resolve`);
  return resolved;
};

test("movies workspace analytics import resolves to the analytics module", () => {
  const workspace = join(
    repositoryRoot,
    "apps/web/src/hooks/movies/index.ts",
  );
  const source = readFileSync(workspace, "utf8");
  const match = source.match(
    /import\s+\{\s*trackMetric\s*\}\s+from\s+["']([^"']+)["']/,
  );

  assert.ok(match, "movies workspace must import trackMetric");
  assert.equal(match[1], "../../services/analytics/index.ts");
  assert.ok(resolveSourceImport(workspace, match[1]));
});

test("serverless runtime imports emit Node-resolvable JavaScript specifiers", () => {
  const pending = serverlessEntries.map((entry) => join(repositoryRoot, entry));
  const visited = new Set<string>();

  while (pending.length > 0) {
    const file = pending.pop();
    assert.ok(file);
    if (visited.has(file)) continue;
    visited.add(file);

    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(runtimeImportPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) continue;

      assert.equal(
        extname(specifier),
        ".js",
        `${file} uses runtime import ${specifier}; emitted Node ESM requires a .js specifier`,
      );
      pending.push(resolveSourceImport(file, specifier));
    }
  }
});
