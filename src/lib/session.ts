import crypto from 'crypto';

// A real deployment would load this from a secret manager. The point of remediation is that the
// session identifier is signed and therefore not forgeable by a client.
const SECRET = process.env.SESSION_SECRET || 'storefront-dev-secret-change-me';

function hmac(value: string): string {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

/** Issue a signed session token for a user id, of the form "<uid>.<hmac>". */
export function signSession(uid: string): string {
  return `${uid}.${hmac(uid)}`;
}

/** Verify a signed session token and return its user id, or null when the signature is invalid. */
export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf('.');
  if (idx <= 0) return null;
  const uid = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = hmac(uid);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return uid;
}
