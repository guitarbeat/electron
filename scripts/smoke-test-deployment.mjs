#!/usr/bin/env node
/**
 * Smoke test deployment script for Vercel Deployment Checks.
 * Validates frontend availability, health endpoints, and sync API routes.
 */

const targetUrl = process.argv[2] || process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const normalizedBase = targetUrl.replace(/\/+$/, '');
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();

console.log(`[Smoke Test] Target deployment URL: ${normalizedBase}`);

const tests = [
  {
    name: 'Frontend index HTML loads',
    path: '/',
    validate: (res, body) => {
      if (res.status !== 200) return `Expected HTTP 200, got ${res.status}`;
      if (!body.includes('<!DOCTYPE html') && !body.includes('<html')) {
        return 'Response does not look like valid HTML';
      }
      return null;
    },
  },
  {
    name: 'Health check endpoint returns ok',
    path: '/api/health',
    validate: (res, body) => {
      if (res.status !== 200) return `Expected HTTP 200, got ${res.status}`;
      try {
        const json = JSON.parse(body);
        if (!json.ok || !json.liveness) return `Health response payload invalid: ${body}`;
      } catch (err) {
        return `Failed to parse JSON response: ${err.message}`;
      }
      return null;
    },
  },
  {
    name: 'State sync API endpoint resolves',
    path: '/api/state/movies',
    validate: (res, body) => {
      // In production or mock dev mode, /api/state/movies should respond with 200 or valid state envelope
      if (res.status !== 200 && res.status !== 304) {
        return `Expected HTTP 200 or 304, got ${res.status}: ${body}`;
      }
      try {
        const json = JSON.parse(body);
        if (typeof json !== 'object' || json === null) {
          return 'Expected JSON object in state response';
        }
      } catch (err) {
        return `Failed to parse JSON response: ${err.message}`;
      }
      return null;
    },
  },
];

let failed = 0;

for (const test of tests) {
  const url = `${normalizedBase}${test.path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Vercel-Deployment-Check-Smoke-Runner/1.0',
        Accept: 'application/json, text/html, */*',
        ...(bypassSecret
          ? { 'x-vercel-protection-bypass': bypassSecret }
          : {}),
      },
      signal: AbortSignal.timeout(15000),
    });
    const body = await res.text();
    const duration = Date.now() - start;
    const error = test.validate(res, body);
    if (error) {
      console.error(`❌ [FAIL] ${test.name} (${duration}ms) - ${error}`);
      failed++;
    } else {
      console.log(`✅ [PASS] ${test.name} (${duration}ms) - HTTP ${res.status}`);
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`❌ [ERROR] ${test.name} (${duration}ms) - ${err.message}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n[Smoke Test] ${failed} check(s) failed.`);
  process.exit(1);
} else {
  console.log(`\n[Smoke Test] All checks passed successfully.`);
  process.exit(0);
}
