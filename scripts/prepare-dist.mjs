import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const webDist = path.resolve(rootDir, "apps/web/dist");
const webDistPublic = path.resolve(rootDir, "apps/web/dist/public");
const rootDist = path.resolve(rootDir, "dist");

const sourceDir = fs.existsSync(webDistPublic) ? webDistPublic : webDist;

if (!fs.existsSync(sourceDir) || !fs.existsSync(path.resolve(sourceDir, "index.html"))) {
  console.error(`[prepare-dist] Valid build output not found at: ${sourceDir}`);
  process.exit(1);
}

// 1. Populate root dist/
fs.mkdirSync(rootDist, { recursive: true });
fs.cpSync(sourceDir, rootDist, { recursive: true });

// 2. Ensure apps/web/dist has direct index.html and assets alongside dist/public
if (sourceDir === webDistPublic) {
  const entries = fs.readdirSync(webDistPublic);
  for (const entry of entries) {
    if (entry === "public") continue;
    const srcPath = path.join(webDistPublic, entry);
    const destPath = path.join(webDist, entry);
    fs.cpSync(srcPath, destPath, { recursive: true });
  }
}

const rootIndexHtml = path.resolve(rootDist, "index.html");
const webIndexHtml = path.resolve(webDist, "index.html");

if (!fs.existsSync(rootIndexHtml) || fs.statSync(rootIndexHtml).size === 0) {
  console.error(`[prepare-dist] index.html missing or empty in ${rootDist}`);
  process.exit(1);
}

if (!fs.existsSync(webIndexHtml) || fs.statSync(webIndexHtml).size === 0) {
  console.error(`[prepare-dist] index.html missing or empty in ${webDist}`);
  process.exit(1);
}

const copiedFiles = fs.readdirSync(rootDist);
console.log(
  `[prepare-dist] Successfully populated dist/ and apps/web/dist/ with ${copiedFiles.length} top-level entries (including index.html).`,
);
