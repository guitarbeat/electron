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

import { existsSync } from 'node:fs';

const targetDirs = [
  fileURLToPath(new URL('../artifacts/electron/src', import.meta.url)),
  fileURLToPath(new URL('../src', import.meta.url)),
].filter((d) => existsSync(d));

const files = targetDirs.flatMap((dir) => walk(dir));
if (files.length === 0) {
  process.exit(0);
}

const tsxCli = fileURLToPath(import.meta.resolve('tsx/cli'));
const result = spawnSync(process.execPath, [tsxCli, '--test', ...files], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
