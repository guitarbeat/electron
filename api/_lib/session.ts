import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

import type { User } from '../../src/shared/types.ts';
import { isUser } from '../../src/utils/shared.ts';

const PROFILE_COOKIE = 'movie_watch_profile';
const PIN_ATTEMPT_COOKIE = 'movie_watch_pin_attempt';
const PROFILE_TTL_SECONDS = 60 * 60 * 24 * 7;
const PIN_ATTEMPT_TTL_SECONDS = 60 * 10;

interface ProfileSessionPayload {
  type: 'profile';
  user: User;
  exp: number;
}

interface PinAttemptPayload {
  type: 'pin_attempt';
  user: User;
  failures: number;
  lockUntil: number | null;
  exp: number;
}

type SessionPayload = ProfileSessionPayload | PinAttemptPayload;

const clean = (value: string | undefined): string =>
  (value || '').trim().replace(/^["']|["']$/g, '');

const getSessionSigningSecret = (): string => {
  const configured = clean(process.env.SESSION_SIGNING_SECRET || process.env.SESSION_SECRET);
  if (!configured) {
    if (process.env.NODE_ENV === 'test') {
      return 'test-session-signing-secret';
    }
    throw new Error(
      'SESSION_SIGNING_SECRET is not configured. ' +
      'Set SESSION_SIGNING_SECRET to a stable secret value in your environment.'
    );
  }
  return configured;
};

const base64urlEncode = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url');

const base64urlDecode = (value: string): string =>
  Buffer.from(value, 'base64url').toString('utf8');

const signValue = (value: string): string =>
  createHmac('sha256', getSessionSigningSecret())
    .update(value)
    .digest('base64url');

const encodeToken = (payload: SessionPayload): string => {
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const verifyToken = <T extends SessionPayload>(
  value: string | undefined,
  expectedType: T['type']
): T | null => {
  if (!value) {
    return null;
  }

  const [encodedPayload, providedSignature] = value.split('.');
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64urlDecode(encodedPayload)) as SessionPayload;
    if (parsed.type !== expectedType || parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    if (parsed.type === 'profile' && !isUser(parsed.user)) {
      return null;
    }
    if (parsed.type === 'pin_attempt') {
      if (
        !isUser(parsed.user) ||
        !Number.isFinite(parsed.failures) ||
        parsed.failures < 0 ||
        (parsed.lockUntil !== null &&
          (!Number.isFinite(parsed.lockUntil) || parsed.lockUntil <= 0))
      ) {
        return null;
      }
    }

    return parsed as T;
  } catch {
    return null;
  }
};

const parseCookies = (req: Request): Record<string, string> => {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [name, ...rest] = part.trim().split('=');
    if (!name) {
      return acc;
    }

    acc[name] = rest.join('=');
    return acc;
  }, {});
};

const buildCookie = (
  req: Request,
  name: string,
  value: string,
  maxAge: number
): string => {
  // Vercel may pass a relative `req.url` which requires a base.
  // For cookie security, prefer forwarded protocol so `Secure` is correct on HTTPS.
  const forwardedProto = (req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-scheme') || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const url = new URL(req.url, 'http://localhost');
  const resolvedProtocol = forwardedProto ? `${forwardedProto}:` : url.protocol;
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  if (resolvedProtocol === 'https:') {
    parts.push('Secure');
  }

  return parts.join('; ');
};

export const buildProfileCookie = (req: Request, user: User): string =>
  buildCookie(
    req,
    PROFILE_COOKIE,
    encodeToken({
      type: 'profile',
      user,
      exp: Math.floor(Date.now() / 1000) + PROFILE_TTL_SECONDS,
    }),
    PROFILE_TTL_SECONDS
  );

export const buildClearProfileCookie = (req: Request): string =>
  buildCookie(req, PROFILE_COOKIE, '', 0);

export const buildPinAttemptCookie = (
  req: Request,
  payload: {
    user: User;
    failures: number;
    lockUntil: number | null;
  }
): string =>
  buildCookie(
    req,
    PIN_ATTEMPT_COOKIE,
    encodeToken({
      type: 'pin_attempt',
      user: payload.user,
      failures: payload.failures,
      lockUntil: payload.lockUntil,
      exp: Math.floor(Date.now() / 1000) + PIN_ATTEMPT_TTL_SECONDS,
    }),
    PIN_ATTEMPT_TTL_SECONDS
  );

export const buildClearPinAttemptCookie = (req: Request): string =>
  buildCookie(req, PIN_ATTEMPT_COOKIE, '', 0);

export const getSessionState = (req: Request): {
  hasAccess: boolean;
  currentUser: User | null;
} => {
  const cookies = parseCookies(req);
  const profile = verifyToken<ProfileSessionPayload>(cookies[PROFILE_COOKIE], 'profile');

  return {
    hasAccess: true,
    currentUser: profile?.user ?? null,
  };
};

export const requireAccessUser = (req: Request): User | null => {
  return getSessionState(req).currentUser;
};

export const hasAccessSession = (req?: Request): boolean => {
  void req;
  return true;
};

export const requireProfileUser = (req: Request): User | null =>
  getSessionState(req).currentUser;

export const getPinAttemptState = (
  req: Request
): {
  user: User;
  failures: number;
  lockUntil: number | null;
} | null => {
  const cookies = parseCookies(req);
  const payload = verifyToken<PinAttemptPayload>(cookies[PIN_ATTEMPT_COOKIE], 'pin_attempt');
  if (!payload) {
    return null;
  }

  return {
    user: payload.user,
    failures: payload.failures,
    lockUntil: payload.lockUntil,
  };
};

export const hashPin = (pin: string): string => {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(pin, salt, 100000, 32, 'sha256');
  return `pbkdf2:100000:${salt.toString('hex')}:${hash.toString('hex')}`;
};

export const verifyStoredPin = (pin: string, storedHash: string): boolean => {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const [, iterations, saltHex, hashHex] = parts;
  const computed = pbkdf2Sync(
    pin,
    Buffer.from(saltHex, 'hex'),
    Number.parseInt(iterations, 10),
    32,
    'sha256'
  );
  const expected = Buffer.from(hashHex, 'hex');

  return (
    expected.length === computed.length &&
    timingSafeEqual(expected, computed)
  );
};
