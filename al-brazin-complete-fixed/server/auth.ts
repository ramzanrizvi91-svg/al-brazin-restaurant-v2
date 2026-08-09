// ==========================================================================
// auth.ts — Password hashing + JWT session auth
// ==========================================================================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// If JWT_SECRET is not set in the environment, we generate a random one at
// boot. This still works, but ALL sessions are invalidated every time the
// server restarts. Set JWT_SECRET in your .env / hosting platform secrets
// for stable logins in production. We warn loudly so this isn't missed.
let secretSource = 'env';
export const JWT_SECRET = (() => {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET') {
    return process.env.JWT_SECRET;
  }
  secretSource = 'generated';
  return [...Array(48)]
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join('');
})();

if (secretSource === 'generated') {
  console.warn(
    '[auth] WARNING: JWT_SECRET is not set. Using a random secret for this run.\n' +
    '         All staff/admin sessions will be logged out on every server restart.\n' +
    '         Set JWT_SECRET in your environment for production use.'
  );
}

const TOKEN_COOKIE = 'ab_session';
const TOKEN_TTL = '12h';

export interface SessionPayload {
  sub: string;        // user id
  username: string;
  role: 'admin' | 'staff';
  branchId: string | null;
  label: string;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(TOKEN_COOKIE);
}

// Augment Express Request with an optional `user` field.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

/** Reads the session cookie (if present) and attaches req.user. Never blocks the request. */
export function attachSession(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch {
      // expired/invalid token — treat as logged out
    }
  }
  next();
}

/** Blocks the request unless the session role is one of `roles`. */
export function requireRole(...roles: Array<'admin' | 'staff'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated. Please sign in again.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}
