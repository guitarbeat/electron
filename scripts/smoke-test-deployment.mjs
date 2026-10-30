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
    name: 'State sync API returns readable movie state',
    path: '/api/state/movies',
    validate: (res, body) => {
      if (res.status !== 200) return `Expected HTTP 200, got ${res.status}`;
      try {
        const json = JSON.parse(body);
        if (!Array.isArray(json.data) || typeof json.version !== 'string') {
          return 'Expected movie data and a state version';
        }
        if (json.degraded !== false) return 'Movie state is degraded';
      } catch (err) {
        return `Failed to parse JSON response: ${err.message}`;
      }
      return null;
    },
  },
  {
    name: 'State sync API rejects unauthenticated mutations',
    path: '/api/state/movies/mutate',
    method: 'POST',
    // An unsupported operation cannot alter state even if authorization regresses.
    body: JSON.stringify({ baseVersion: '', op: '__smoke_auth_probe__', payload: {} }),
    validate: (res, body) => {
      if (res.status !== 401) {
        return `Expected HTTP 401, got ${res.status}`;
      }
      try {
        const json = JSON.parse(body);
        if (json?.error !== 'Profile session required.') {
          return 'Expected profile-session-required error envelope';
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
      method: test.method || 'GET',
      body: test.body,
      headers: {
        'User-Agent': 'Vercel-Deployment-Check-Smoke-Runner/1.0',
        Accept: 'application/json, text/html, */*',
        ...(test.body ? { 'Content-Type': 'application/json' } : {}),
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
