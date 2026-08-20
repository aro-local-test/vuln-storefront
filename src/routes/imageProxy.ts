import { Router, Request, Response } from 'express';
import http from 'http';
import https from 'https';
import dns from 'dns/promises';
import net from 'net';

const router = Router();

function normalizeIp(ip: string): string {
  // IPv4-mapped IPv6 (for example ::ffff:127.0.0.1) collapses to its IPv4 form for range checks.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  return mapped ? mapped[1] : ip;
}

function isBlockedAddress(rawIp: string): boolean {
  const ip = normalizeIp(rawIp);
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local and cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT (Fly.io internals)
    return false;
  }
  const low = ip.toLowerCase();
  return low === '::1' || low === '::' || low.startsWith('fe80') || low.startsWith('fc') || low.startsWith('fd');
}

router.get('/image-proxy', async (req: Request, res: Response) => {
  const target = String(req.query.url || '');
  if (!target) {
    res.status(400).json({ error: 'url required' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    res.status(400).json({ error: 'invalid url' });
    return;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    res.status(400).json({ error: 'unsupported scheme' });
    return;
  }

  // Resolve every address the host maps to and reject if ANY is internal.
  let resolved;
  try {
    resolved = await dns.lookup(parsed.hostname, { all: true });
  } catch {
    res.status(400).json({ error: 'host resolution failed' });
    return;
  }
  if (resolved.length === 0 || resolved.some((a) => isBlockedAddress(a.address))) {
    res.status(403).json({ error: 'destination host is not allowed' });
    return;
  }

  // Pin the connection to the address we just validated. Without this, DNS rebinding between the
  // check above and the request below could redirect the fetch to an internal host.
  const pinned = resolved[0];
  const pinnedLookup = (
    _hostname: string,
    _options: unknown,
    cb: (err: Error | null, address: string, family: number) => void,
  ): void => {
    cb(null, pinned.address, pinned.family);
  };

  const client = parsed.protocol === 'https:' ? https : http;
  const upstream = client.get(target, { lookup: pinnedLookup } as http.RequestOptions, (r) => {
    const status = r.statusCode || 502;
    // Do not follow or stream redirects: a 3xx could point back at an internal host and the
    // redirect target is not re-validated.
    if (status >= 300 && status < 400) {
      r.resume();
      res.status(502).json({ error: 'upstream redirect not allowed' });
      return;
    }
    // Only proxy image responses, so this endpoint cannot be used as a general-purpose fetch or
    // anonymizing proxy for arbitrary content.
    const contentType = String(r.headers['content-type'] || '');
    if (!contentType.startsWith('image/')) {
      r.resume();
      res.status(415).json({ error: 'only image responses are proxied' });
      return;
    }
    res.status(status);
    res.setHeader('content-type', contentType);
    r.pipe(res);
  });

  upstream.on('error', (err: Error) => {
    res.status(502).json({ error: 'fetch failed', detail: err.message });
  });
});

export default router;
