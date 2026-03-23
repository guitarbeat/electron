import { jsonResponse, mergeHeaders, methodNotAllowedResponse } from './_lib/http.ts';
import { readGistFile } from './_lib/gistStore.ts';

/** Known scope file; used only to verify the gist read path (may be null if not created yet). */
const READINESS_PROBE_FILE = 'movielist.json';

export default async function handler(req: Request): Promise<Response> {
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

  const url = new URL(req.url);
  const deep = url.searchParams.get('deep') === '1';

  if (!deep) {
    return jsonResponse({ ok: true, liveness: true });
  }

  try {
    await readGistFile(READINESS_PROBE_FILE, { bypassCache: false });
    return jsonResponse({ ok: true, liveness: true, readiness: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(
      { ok: false, liveness: true, readiness: false, error: message },
      { status: 503 }
    );
  }
}
