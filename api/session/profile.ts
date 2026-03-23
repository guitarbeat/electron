import {
  badRequestResponse,
  jsonResponse,
  methodNotAllowedResponse,
  mergeHeaders,
  serverErrorResponse,
} from '../_lib/http.ts';
import {
  buildClearProfileCookie,
  buildPinAttemptCookie,
  buildProfileCookie,
  getPinAttemptState,
  getSessionState,
} from '../_lib/session.ts';
import { getPinProtectedUsers, verifyProfilePin } from '../_lib/state.ts';
import { isUser } from '../../src/utils/shared.ts';

const PROFILE_STORE_CONFIG_ERROR =
  'Profile login is unavailable because the shared pin store is not configured. Set GIST_ID on the server, or VITE_GIST_ID during local Vite development, to enable profile PINs.';
const SESSION_SECRET_CONFIG_ERROR = [
  'Profile login is unavailable because SESSION_SIGNING_SECRET is not configured.',
  '',
  'Diagnostic (copy/paste):',
  'code=SESSION_SIGNING_SECRET_MISSING',
  'endpoint=/api/session/profile',
  'method=POST',
  'action=Set SESSION_SIGNING_SECRET in .env.local and restart pnpm dev',
].join('\n');

const isMissingPinStoreConfigError = (error: unknown): boolean =>
  error instanceof Error && error.message === 'GIST_ID is not configured.';
const isMissingSessionSecretError = (error: unknown): boolean =>
  error instanceof Error && error.message === 'SESSION_SIGNING_SECRET is not configured.';

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 5 * 60 * 1000;

export const profilePinRateLimitConfig = {
  maxAttempts: MAX_PIN_ATTEMPTS,
  lockoutMs: PIN_LOCKOUT_MS,
} as const;

const getLockoutRemainingSeconds = (lockedUntil: number, now: number): number =>
  Math.max(1, Math.ceil((lockedUntil - now) / 1000));

export const computeNextPinAttemptState = (
  currentFailures: number,
  now: number
): { failures: number; lockedUntil: number | null } => {
  const nextFailures = currentFailures + 1;
  return {
    failures: nextFailures,
    lockedUntil: nextFailures >= MAX_PIN_ATTEMPTS ? now + PIN_LOCKOUT_MS : null,
  };
};

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'DELETE') {
      let pinProtectedUsers: Awaited<ReturnType<typeof getPinProtectedUsers>> = [];
      try {
        pinProtectedUsers = await getPinProtectedUsers();
      } catch (error) {
        console.warn('Failed to read pin-protected users during logout.', error);
      }

      return jsonResponse(
        {
          hasAccess: true,
          currentUser: null,
          pinProtectedUsers,
        },
        {
          headers: mergeHeaders({
            'Set-Cookie': buildClearProfileCookie(req),
          }),
        }
      );
    }

    if (req.method !== 'POST') {
      return methodNotAllowedResponse('POST, DELETE');
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return badRequestResponse('Invalid JSON payload.');
    }

    const user = (payload as { user?: unknown }).user;
    const pin =
      typeof (payload as { pin?: unknown }).pin === 'string'
        ? (payload as { pin: string }).pin
        : undefined;

    if (!isUser(user)) {
      return badRequestResponse('A valid user is required.');
    }

    const now = Date.now();
    const attemptState = getPinAttemptState(req);
    const failuresForUser = attemptState?.user === user ? attemptState.failures : 0;
    const lockUntil = attemptState?.user === user ? attemptState.lockUntil : null;
    if (lockUntil && lockUntil > now) {
      const retryAfter = getLockoutRemainingSeconds(lockUntil, now);
      return jsonResponse(
        {
          error: `Too many incorrect PIN attempts. Try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    const isValid = await verifyProfilePin(user, pin);
    if (!isValid) {
      const failedState = computeNextPinAttemptState(failuresForUser, now);
      if (failedState.lockedUntil) {
        const retryAfter = getLockoutRemainingSeconds(failedState.lockedUntil, now);
        return jsonResponse(
          {
            error: `Too many incorrect PIN attempts. Try again in ${retryAfter} seconds.`,
          },
          {
            status: 429,
            headers: mergeHeaders(
              { 'Retry-After': String(retryAfter) },
              {
                'Set-Cookie': buildPinAttemptCookie(req, {
                  user,
                  failures: failedState.failures,
                  lockUntil: failedState.lockedUntil,
                }),
              }
            ),
          }
        );
      }
      return jsonResponse(
        { error: 'Incorrect PIN.' },
        {
          status: 401,
          headers: {
            'Set-Cookie': buildPinAttemptCookie(req, {
              user,
              failures: failedState.failures,
              lockUntil: failedState.lockedUntil,
            }),
          },
        }
      );
    }

    const currentSession = getSessionState(req);
    const pinProtectedUsers = await getPinProtectedUsers();

    return jsonResponse(
      {
        hasAccess: currentSession.hasAccess,
        currentUser: user,
        pinProtectedUsers,
      },
      {
        headers: mergeHeaders({
          'Set-Cookie': buildProfileCookie(req, user),
        }),
      }
    );
  } catch (error) {
    if (isMissingPinStoreConfigError(error)) {
      return serverErrorResponse(PROFILE_STORE_CONFIG_ERROR);
    }
    if (isMissingSessionSecretError(error)) {
      return serverErrorResponse(SESSION_SECRET_CONFIG_ERROR);
    }

    console.error('Failed to update profile session', error);
    return serverErrorResponse();
  }
}
