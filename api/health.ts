import { jsonResponse, mergeHeaders, methodNotAllowedResponse } from './_lib/http.js';
import { getPinCoverageState, getStateScopeDiagnostics } from './_lib/state.js';
import { withWebHandler } from './_lib/webHandler.js';

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: mergeHeaders({
        Allow: 'GET, OPTIONS',
      }),
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET, OPTIONS');
  }

  // Vercel may pass a relative `req.url` (e.g. "/api/health") which throws without a base.
  const url = new URL(req.url, 'http://localhost');
  const deep = url.searchParams.get('deep') === '1';

  if (!deep) {
    return jsonResponse({ ok: true, liveness: true });
  }

  try {
    const [scopeDiagnostics, pinCoverage] = await Promise.all([
      getStateScopeDiagnostics(),
      getPinCoverageState(),
    ]);

    return jsonResponse({
      ok: true,
      liveness: true,
      readiness: true,
      expectedScopes: scopeDiagnostics.expectedScopes,
      missingScopes: scopeDiagnostics.missingScopes,
      pinProtectedUsers: pinCoverage.pinProtectedUsers,
      usersMissingPins: pinCoverage.usersMissingPins,
      pinCoverageComplete: pinCoverage.pinCoverageComplete,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(
      { ok: false, liveness: true, readiness: false, error: message },
      { status: 503 }
    );
  }
}

export default withWebHandler(handler);
