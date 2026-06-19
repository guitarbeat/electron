import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist", "assets");
const baselinePath = path.join(__dirname, "bundle-size-baseline.json");

const gzipSize = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return zlib.gzipSync(buffer).length;
};

const findAsset = (pattern) => {
  const files = fs
    .readdirSync(distDir)
    .filter((file) => pattern.test(file))
    .map((file) => path.join(distDir, file));

  if (files.length === 0) {
    throw new Error(`Missing dist asset matching ${pattern}`);
  }

  return files.reduce((largest, filePath) => {
    const size = fs.statSync(filePath).size;
    const largestSize = fs.statSync(largest).size;
    return size > largestSize ? filePath : largest;
  });
};

const resolveMeasuredSizes = () => ({
  "index.js": gzipSize(findAsset(/^index-.*\.js$/)),
  "index.css": gzipSize(findAsset(/^index-.*\.css$/)),
  "AppWorkspaceShell.js": gzipSize(findAsset(/^AppWorkspaceShell-.*\.js$/)),
});

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

const main = () => {
  if (!fs.existsSync(distDir)) {
    console.error("dist/assets not found — run `pnpm build` or `pnpm analyze` first.");
    process.exit(1);
  }

  const measured = resolveMeasuredSizes();
  const update = process.argv.includes("--update");

  if (update) {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    baseline.files = measured;
    fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log("Updated bundle-size-baseline.json:");
    for (const [key, size] of Object.entries(measured)) {
      console.log(`  ${key}: ${formatKb(size)} gzip`);
    }
    return;
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const tolerance = baseline.toleranceRatio ?? 0.1;
  let failed = false;

  for (const [key, limit] of Object.entries(baseline.files)) {
    const actual = measured[key];
    const maxAllowed = Math.ceil(limit * (1 + tolerance));
    if (actual > maxAllowed) {
      failed = true;
      console.error(
        `Bundle regression: ${key} gzip ${formatKb(actual)} exceeds budget ${formatKb(maxAllowed)} (baseline ${formatKb(limit)} + ${Math.round(tolerance * 100)}%)`,
      );
    } else {
      console.log(
        `OK ${key}: ${formatKb(actual)} gzip (budget ${formatKb(maxAllowed)})`,
      );
    }
  }

  if (failed) {
    process.exit(1);
  }
};

main();
