import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const walk = (dir) => {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      out.push(...walk(p));
    } else if (name.isFile() && name.name.endsWith('.test.ts')) {
      out.push(p);
    }
  }
  return out;
};

const srcDir = fileURLToPath(new URL('../src', import.meta.url));
const files = walk(srcDir);
if (files.length === 0) {
  process.exit(0);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
