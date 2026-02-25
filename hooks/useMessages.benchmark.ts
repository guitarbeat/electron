import fs from 'node:fs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { pollingManager } from '../services/PollingManager.ts';

const USE_MESSAGES_PATH = path.join(process.cwd(), 'hooks', 'useMessages.ts');

async function runBenchmark() {
  console.log('--- useMessages Polling Benchmark ---');

  // 1. Parse current interval
  const content = fs.readFileSync(USE_MESSAGES_PATH, 'utf-8');
  let interval = 0;

  // Try finding the constant definition directly
  const matchConstDef = content.match(/const\s+MESSAGE_POLLING_INTERVAL\s*=\s*(\d+);/);
  if (matchConstDef) {
    interval = parseInt(matchConstDef[1], 10);
    console.log(`Detected Interval (constant): ${interval}ms`);
  } else {
    // Fallback to literal in usePolling call
    const matchLiteral = content.match(/usePolling\(getMessages,\s*(\d+)/);
    if (matchLiteral) {
      interval = parseInt(matchLiteral[1], 10);
      console.log(`Detected Interval (literal): ${interval}ms`);
    }
  }

  if (!interval) {
    console.error('Failed to extract interval.');
    process.exit(1);
  }

  // 2. Setup mock
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return [];
  };

  const key = 'benchmark-messages-' + Date.now();

  // 3. Run simulation
  console.log('Starting 20s simulation...');

  const startTime = Date.now();
  const unsubscribe = pollingManager.subscribe(key, mockFetch, interval, () => {});

  await setTimeout(20100);

  unsubscribe();
  const endTime = Date.now();

  console.log(`Simulation complete. Duration: ${endTime - startTime}ms`);
  console.log(`Total API Calls: ${callCount}`);
}

runBenchmark().catch(console.error);
