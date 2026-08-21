import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ACCOUNTS, esc, page } from '../lib/state';
import { signSession } from '../lib/session';
import { requireAuth } from '../lib/auth';

const router = Router();

type AuthedRequest = Request & { uid?: string };

// Simple in-memory per-IP rate limiter for the login endpoint.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
function loginRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

function passwordMatches(input: string, expectedHash: string): boolean {
  const got = crypto.createHash('sha256').update(input).digest('hex');
  if (got.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expectedHash));
}

// Reject state-changing cross-site requests: require a same-origin Origin or Referer, and reject
// when neither header is present (an omitted Origin must not bypass the check).
function isSameOrigin(req: Request): boolean {
  const host = req.get('host') || '';
  const source = req.get('origin') || req.get('referer');
  if (!source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

router.get('/login', (_req: Request, res: Response) => {
  const form =
    '<form method="POST" action="/login">' +
    '<input name="user" placeholder="user">' +
    '<input name="password" type="password" placeholder="password">' +
    '<button type="submit">Log in</button>' +
    '</form>';
  res.type('html');
  res.send(page('Login', '<h2>Sign in</h2>' + form));
});

router.post('/login', (req: Request, res: Response) => {
  if (loginRateLimited(req.ip || 'unknown')) {
    res.status(429).json({ error: 'too many attempts, try again later' });
    return;
  }
  const uid = String(req.body.user || '');
  const password = String(req.body.password || '');
  const account = ACCOUNTS[uid];
  // Identical response for unknown user or wrong password, so accounts cannot be enumerated.
  if (!account || !password || !passwordMatches(password, account.passwordHash)) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }
  res.cookie('session_user', signSession(uid), { httpOnly: true, sameSite: 'strict', path: '/' });
  res.json({ ok: true, uid });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('session_user', { path: '/' });
  res.json({ ok: true });
});

router.get('/account', requireAuth, (req: Request, res: Response) => {
  const uid = (req as AuthedRequest).uid as string;
  const account = ACCOUNTS[uid];
  const form =
    '<form method="POST" action="/account/email">' +
    '<input name="email" value="' +
    esc(account.email) +
    '"><button type="submit">Save</button></form>';
  res.type('html').send(page('Account', '<h2>Account ' + esc(uid) + '</h2>' + form));
});

router.post('/account/email', requireAuth, (req: Request, res: Response) => {
  if (!isSameOrigin(req)) {
    res.status(403).json({ error: 'cross-origin request blocked' });
    return;
  }
  const uid = (req as AuthedRequest).uid as string;
  const email = String(req.body.email || '');
  ACCOUNTS[uid] = { ...ACCOUNTS[uid], email };
  res.json({ ok: true, uid, email });
});

export default router;
