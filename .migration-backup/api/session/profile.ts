import {
  badRequestResponse,
  jsonResponse,
  methodNotAllowedResponse,
  mergeHeaders,
  serverErrorResponse,
} from '../_lib/http.ts';
import {
  buildClearPinAttemptCookie,
  buildClearProfileCookie,
  buildPinAttemptCookie,
  buildProfileCookie,
  getSessionState,
} from '../_lib/session.ts';
import { getPinCoverageState, verifyProfilePin } from '../_lib/state.ts';
import {
  clearPinAttempts,
  getPinAttemptRecord,
  recordPinFailure,
} from '../_lib/pinAttemptStore.ts';
import { withWebHandler } from '../_lib/webHandler.ts';
import { isUser } from '../../src/utils/shared.ts';

const SESSION_SECRET_CONFIG_ERROR = [
  'Profile login is unavailable because SESSION_SIGNING_SECRET is not configured.',
  '',
  'Diagnostic (copy/paste):',
  'code=SESSION_SIGNING_SECRET_MISSING',
  'endpoint=/api/session/profile',
  'method=POST',
  'action=Set SESSION_SIGNING_SECRET in .env.local and restart pnpm dev',
].join('\n');

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

async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'DELETE') {
      let pinProtectedUsers: string[] = [];
      let usersMissingPins: string[] = [];
      try {
        const pinCoverage = await getPinCoverageState();
        pinProtectedUsers = pinCoverage.pinProtectedUsers;
        usersMissingPins = pinCoverage.usersMissingPins;
      } catch (error) {
        console.warn('Failed to read PIN coverage during logout.', error);
      }

      return jsonResponse(
        {
          hasAccess: true,
          currentUser: null,
          pinProtectedUsers,
          usersMissingPins,
        },
        {
          headers: mergeHeaders(
            {
              'Set-Cookie': buildClearProfileCookie(req),
            },
            {
              'Set-Cookie': buildClearPinAttemptCookie(req),
            }
          ),
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

    let pinProtectedUsers: string[] = [];
    let usersMissingPins: string[] = [];
    try {
      const pinCoverage = await getPinCoverageState();
      pinProtectedUsers = pinCoverage.pinProtectedUsers;
      usersMissingPins = pinCoverage.usersMissingPins;
    } catch (error) {
      console.warn('Failed to read PIN coverage during profile update.', error);
    }
    const requiresPin = pinProtectedUsers.includes(user);

    if (requiresPin) {
      const now = Date.now();

      // Authoritative lockout check is server-side (DB). The cookie is only
      // issued for client-side countdown UX and is never trusted as truth.
      const dbAttemptState = await getPinAttemptRecord(user);
      const failuresForUser = dbAttemptState.failures;
      const lockUntil = dbAttemptState.lockedUntil;

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
        // Persist to DB so lockout survives cookie deletion / new browsers.
        await recordPinFailure(user, failedState.failures, failedState.lockedUntil);

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
                  // Cookie is a client hint only; lockout is enforced via DB above.
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

      // Successful login — reset server-side counter.
      await clearPinAttempts(user);
    }

    const currentSession = getSessionState(req);

    return jsonResponse(
      {
        hasAccess: currentSession.hasAccess,
        currentUser: user,
        pinProtectedUsers,
        usersMissingPins,
      },
      {
        headers: mergeHeaders(
          {
            'Set-Cookie': buildProfileCookie(req, user),
          },
          {
            'Set-Cookie': buildClearPinAttemptCookie(req),
          }
        ),
      }
    );
  } catch (error) {
    if (isMissingSessionSecretError(error)) {
      return serverErrorResponse(SESSION_SECRET_CONFIG_ERROR);
    }

    console.error(`Failed to update profile session during ${req.method} ${req.url}:`, error);
    return serverErrorResponse();
  }
}

export default withWebHandler(handler);
