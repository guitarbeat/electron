/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pollingManager } from '../services/PollingManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const useMessagesPath = path.resolve(__dirname, '../hooks/useMessages.ts');

const SIMULATION_DURATION_MS = 21000;

async function runBenchmark() {
  console.log('--- Message Polling Benchmark ---');

  const sourceCode = fs.readFileSync(useMessagesPath, 'utf-8');

  let interval = 0;

  // Try to find the constant first
  const constantMatch = sourceCode.match(/export const MESSAGE_POLLING_INTERVAL = (\d+)/);
  if (constantMatch) {
    interval = parseInt(constantMatch[1], 10);
  } else {
    // Fallback to inline value
    const match = sourceCode.match(/usePolling\(\s*getMessages,\s*(\d+)/);
    if (match) {
      interval = parseInt(match[1], 10);
    }
  }

  if (!interval) {
    console.error('Could not find interval in useMessages.ts');
    process.exit(1);
  }

  console.log(`Detected Polling Interval: ${interval}ms`);

  let fetchCount = 0;
  const mockFetch = async () => {
    fetchCount++;
    return [{ id: '1', content: 'test', author: 'test', createdAt: new Date().toISOString() }];
  };

  const key = 'benchmark-messages';

  console.log(`Simulating ${SIMULATION_DURATION_MS / 1000}s of polling...`);

  const unsubscribe = pollingManager.subscribe(key, mockFetch, interval, () => {});

  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, SIMULATION_DURATION_MS);
  });

  unsubscribe();

  console.log(`Total Fetches: ${fetchCount}`);
}

runBenchmark().catch(console.error);
