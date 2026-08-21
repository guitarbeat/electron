import type {
  MutationRequest,
  StateScope,
  StateScopeDataMap,
} from '../../artifacts/electron/src/services/state/stateTypes.js';
import {
  badRequestResponse,
  conflictResponse,
  jsonResponse,
  methodNotAllowedResponse,
  normalizeEtag,
  serverErrorResponse,
  toQuotedEtag,
  unauthorizedResponse,
} from './http.js';
import { patchSharedStateFile } from './sharedStateStore.js';
import { hasAccessSession, requireProfileUser } from './session.js';
import {
  buildFallbackScopeData,
  computeVersion,
  getScopeDefinition,
  getScopeWarning,
  parseMutationRequest,
  readScopeStoredData,
} from './state.js';

export const createReadHandler =
  <TScope extends StateScope>(scope: TScope) =>
  async (request: Request): Promise<Response> => {
    try {
      if (request.method !== 'GET') return methodNotAllowedResponse('GET');
      if (!hasAccessSession(request)) return unauthorizedResponse();

      let clientData: StateScopeDataMap[TScope];
      let version: string;
      let degraded = false;
      let warning: string | undefined;

      try {
        const stored = await readScopeStoredData(scope, { bypassCache: true });
        clientData = stored.clientData;
        version = stored.version;
        if (stored.usesFallbackStore) {
          degraded = true;
          warning = getScopeWarning(new Error('DATABASE_URL is not configured.'));
        }
      } catch (error) {
        const fallback = buildFallbackScopeData(scope);
        clientData = fallback.clientData;
        version = fallback.version;
        degraded = true;
        warning = getScopeWarning(error);
        console.warn(`Falling back to default ${scope} state.`, error);
      }

      const incomingEtag = normalizeEtag(request.headers.get('if-none-match'));
      if (!degraded && incomingEtag && incomingEtag === normalizeEtag(version)) {
        return new Response(null, {
          status: 304,
          headers: { ETag: toQuotedEtag(version), 'Cache-Control': 'no-store' },
        });
      }

      return jsonResponse(
        { data: clientData, version, degraded, warning },
        { headers: { ETag: toQuotedEtag(version) } }
      );
    } catch (error) {
      console.error(
        `Failed to read ${scope} state during ${request.method} ${request.url}:`,
        error
      );
      const fallback = buildFallbackScopeData(scope);
      return jsonResponse(
        {
          data: fallback.clientData,
          version: fallback.version,
          degraded: true,
          warning: getScopeWarning(error),
        },
        { status: 200 }
      );
    }
  };

export const createMutateHandler =
  <TScope extends StateScope>(scope: TScope) =>
  async (request: Request): Promise<Response> => {
    try {
      if (request.method !== 'POST') return methodNotAllowedResponse('POST');
      if (!hasAccessSession(request)) return unauthorizedResponse();

      const definition = getScopeDefinition(scope);
      if (!definition.mutate) {
        return badRequestResponse(`Mutations are not supported for ${scope}.`);
      }

      let mutation: MutationRequest;
      try {
        mutation = await parseMutationRequest(request);
      } catch (error) {
        return badRequestResponse(
          error instanceof Error ? error.message : 'Invalid mutation request.'
        );
      }

      const currentUser = requireProfileUser(request);
      const anonymousAllowed =
        !currentUser &&
        Boolean(definition.allowAnonymousMutation?.(mutation.op, mutation.payload));
      if (!currentUser && !anonymousAllowed) {
        return unauthorizedResponse('Profile session required.');
      }

      const latest = await readScopeStoredData(scope, { bypassCache: true });
      if (mutation.baseVersion !== latest.version) {
        console.warn(
          `[state] Version divergence on "${scope}" (op: ${mutation.op}): ` +
            `client sent ${mutation.baseVersion.slice(0, 8)}…, ` +
            `server has ${latest.version.slice(0, 8)}…. ` +
            `Proceeding with last-writer-wins merge.`
        );
      }

      const result = definition.mutate(latest.stored, mutation.op, mutation.payload, {
        currentUser,
        now: new Date().toISOString(),
      });
      if (!result.ok) {
        return conflictResponse({
          currentData: latest.clientData,
          currentVersion: latest.version,
          conflict: result.conflict,
        });
      }

      const clientData = definition.toClient(result.data) as StateScopeDataMap[TScope];
      const nextVersion = computeVersion(clientData);
      await patchSharedStateFile(definition.filename, definition.serialize(result.data));

      return jsonResponse(
        { data: clientData, version: nextVersion, degraded: false, applied: true },
        { headers: { ETag: toQuotedEtag(nextVersion) } }
      );
    } catch (error) {
      console.error(
        `Failed to mutate ${scope} state during ${request.method} ${request.url}:`,
        error
      );
      return serverErrorResponse(error);
    }
  };
