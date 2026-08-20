import crypto from 'crypto';

// No hardcoded fallback: when SESSION_SECRET is unset we generate a random per-process secret,
// so session tokens can never be forged offline from a value baked into the source or image.
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Sessions expire, so a leaked or stale token does not grant permanent access.
const TTL_MS = 30 * 60 * 1000;

function hmac(value: string): string {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

/** Issue a signed, expiring session token of the form "<uid>.<expiryMs>.<hmac>". */
export function signSession(uid: string): string {
  const payload = `${uid}.${Date.now() + TTL_MS}`;
  return `${payload}.${hmac(payload)}`;
}

/** Verify a session token and return its user id, or null if the signature is invalid or expired. */
export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [uid, expiry, sig] = parts;
  const payload = `${uid}.${expiry}`;
  const expected = hmac(payload);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  return uid;
}
