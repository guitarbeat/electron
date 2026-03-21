import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import type { User } from '../../src/types.ts';
import { isUser } from '../../src/utils.ts';

const ACCESS_COOKIE = 'movie_watch_access';
const PROFILE_COOKIE = 'movie_watch_profile';
const ACCESS_TTL_SECONDS = 60 * 60 * 24 * 7;
const PROFILE_TTL_SECONDS = 60 * 60 * 24 * 7;

interface AccessSessionPayload {
  type: 'access';
  exp: number;
}

interface ProfileSessionPayload {
  type: 'profile';
  user: User;
  exp: number;
}

type SessionPayload = AccessSessionPayload | ProfileSessionPayload;

const clean = (value: string | undefined): string =>
  (value || '').trim().replace(/^["']|["']$/g, '');

const getAppAccessSecret = (): string =>
  clean(process.env.APP_ACCESS_SECRET);

const getSessionSigningSecret = (): string =>
  clean(process.env.SESSION_SIGNING_SECRET);

const assertSecret = (name: string, value: string): string => {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

const base64urlEncode = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url');

const base64urlDecode = (value: string): string =>
  Buffer.from(value, 'base64url').toString('utf8');

const signValue = (value: string): string =>
  createHmac('sha256', assertSecret('SESSION_SIGNING_SECRET', getSessionSigningSecret()))
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
  const url = new URL(req.url);
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  if (url.protocol === 'https:') {
    parts.push('Secure');
  }

  return parts.join('; ');
};

export const buildAccessCookie = (req: Request): string =>
  buildCookie(
    req,
    ACCESS_COOKIE,
    encodeToken({
      type: 'access',
      exp: Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS,
    }),
    ACCESS_TTL_SECONDS
  );

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

export const hasValidAppSecret = (secret: string): boolean => {
  const configured = assertSecret('APP_ACCESS_SECRET', getAppAccessSecret());
  const left = Buffer.from(secret);
  const right = Buffer.from(configured);

  return left.length === right.length && timingSafeEqual(left, right);
};

export const getSessionState = (req: Request): {
  hasAccess: boolean;
  currentUser: User | null;
} => {
  const cookies = parseCookies(req);
  const access = verifyToken<AccessSessionPayload>(cookies[ACCESS_COOKIE], 'access');
  const profile = verifyToken<ProfileSessionPayload>(cookies[PROFILE_COOKIE], 'profile');

  return {
    hasAccess: Boolean(access),
    currentUser: access ? profile?.user ?? null : null,
  };
};

export const requireAccessUser = (req: Request): User | null => {
  const { hasAccess, currentUser } = getSessionState(req);
  return hasAccess ? currentUser : null;
};

export const hasAccessSession = (req: Request): boolean =>
  getSessionState(req).hasAccess;

export const requireProfileUser = (req: Request): User | null =>
  getSessionState(req).currentUser;

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
