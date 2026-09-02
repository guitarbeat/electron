import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const webDistPublic = path.resolve(rootDir, "apps/web/dist/public");
const rootDist = path.resolve(rootDir, "dist");

if (!fs.existsSync(webDistPublic)) {
  console.error(`[prepare-dist] Build output not found at: ${webDistPublic}`);
  process.exit(1);
}

fs.mkdirSync(rootDist, { recursive: true });
fs.cpSync(webDistPublic, rootDist, { recursive: true });

const indexHtmlPath = path.resolve(rootDist, "index.html");
if (!fs.existsSync(indexHtmlPath)) {
  console.error(`[prepare-dist] index.html missing in ${rootDist}`);
  process.exit(1);
}

const copiedFiles = fs.readdirSync(rootDist);
console.log(
  `[prepare-dist] Successfully populated root dist/ with ${copiedFiles.length} top-level entries (including index.html).`,
);
